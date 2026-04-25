import crypto from "crypto";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface ForensicResult {
  valid: boolean;
  checks: {
    gpsMatch: { passed: boolean; distance: number | null; detail: string };
    timestampFresh: { passed: boolean; ageMinutes: number | null; detail: string };
    hashUnique: { passed: boolean; detail: string };
  };
  riskLevel: "clean" | "suspicious" | "fraudulent";
}

// ─── Distance calculator (Haversine) ────────────────────────────────────────
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Image Hash for Duplicate Detection ─────────────────────────────────────
const seenHashes = new Set<string>();

function computeImageHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// ─── EXIF Metadata Extraction ───────────────────────────────────────────────
// In production, this reads real EXIF data from the JPEG binary.
// For now we parse what the client sends as metadata alongside the image.
export interface PhotoMetadata {
  exifLat?: number;
  exifLng?: number;
  exifTimestamp?: string; // ISO string from DateTimeOriginal
  imageBuffer?: Buffer;   // Raw image bytes for hash
}

// ─── Main Forensic Check ────────────────────────────────────────────────────
export function runForensics(
  reportedLat: number,
  reportedLng: number,
  photoMeta: PhotoMetadata,
  maxDistanceMeters: number = 200,
  maxAgeMinutes: number = 60
): ForensicResult {
  const checks: ForensicResult["checks"] = {
    gpsMatch: { passed: true, distance: null, detail: "No EXIF GPS data to compare" },
    timestampFresh: { passed: true, ageMinutes: null, detail: "No EXIF timestamp to compare" },
    hashUnique: { passed: true, detail: "No image data to hash" },
  };

  let flags = 0;

  // ─── Check 1: GPS Location Match ──────────────────────────────────────
  if (photoMeta.exifLat != null && photoMeta.exifLng != null) {
    const distance = haversineMeters(reportedLat, reportedLng, photoMeta.exifLat, photoMeta.exifLng);
    const passed = distance <= maxDistanceMeters;
    checks.gpsMatch = {
      passed,
      distance: Math.round(distance),
      detail: passed
        ? `Photo GPS matches report location (${Math.round(distance)}m away)`
        : `MISMATCH: Photo was taken ${Math.round(distance)}m away from reported location`,
    };
    if (!passed) flags++;
  }

  // ─── Check 2: Timestamp Freshness ─────────────────────────────────────
  if (photoMeta.exifTimestamp) {
    const photoTime = new Date(photoMeta.exifTimestamp).getTime();
    const now = Date.now();
    const ageMinutes = Math.round((now - photoTime) / (1000 * 60));
    const passed = ageMinutes <= maxAgeMinutes && ageMinutes >= -5; // allow 5min clock skew
    checks.timestampFresh = {
      passed,
      ageMinutes,
      detail: passed
        ? `Photo taken ${ageMinutes} minutes ago (within ${maxAgeMinutes}min window)`
        : `STALE: Photo is ${ageMinutes} minutes old (max allowed: ${maxAgeMinutes}min)`,
    };
    if (!passed) flags++;
  }

  // ─── Check 3: Duplicate Image Hash ────────────────────────────────────
  if (photoMeta.imageBuffer && photoMeta.imageBuffer.length > 0) {
    const hash = computeImageHash(photoMeta.imageBuffer);
    const isDuplicate = seenHashes.has(hash);
    checks.hashUnique = {
      passed: !isDuplicate,
      detail: isDuplicate
        ? `DUPLICATE: This exact image has been submitted before (hash: ${hash.substring(0, 12)}...)`
        : `Unique image (hash: ${hash.substring(0, 12)}...)`,
    };
    if (isDuplicate) flags++;
    seenHashes.add(hash);
  }

  // ─── Risk Assessment ──────────────────────────────────────────────────
  let riskLevel: ForensicResult["riskLevel"] = "clean";
  if (flags === 1) riskLevel = "suspicious";
  if (flags >= 2) riskLevel = "fraudulent";

  return {
    valid: flags === 0,
    checks,
    riskLevel,
  };
}
