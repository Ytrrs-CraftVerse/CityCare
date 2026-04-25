import QRCode from "qrcode";
import crypto from "crypto";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface GeoFencedQR {
  qrDataUrl: string;    // Base64 PNG of the QR code
  qrPayload: string;    // The encrypted payload string inside the QR
  assetId: string;
  boundLat: number;
  boundLng: number;
  issuedAt: string;
}

export interface QRScanResult {
  valid: boolean;
  withinGeofence: boolean;
  distance: number;
  detail: string;
}

// ─── Secret for HMAC signing QR payloads ────────────────────────────────────
const QR_SECRET = process.env.JWT_SECRET || "citycare_qr_secret";

// ─── Generate a Geo-fenced QR Code for an Asset ────────────────────────────
export async function generateAssetQR(
  issueId: string,
  assetId: string,
  lat: number,
  lng: number
): Promise<GeoFencedQR> {
  const payload = JSON.stringify({
    issueId,
    assetId,
    lat: lat.toFixed(6),
    lng: lng.toFixed(6),
    issuedAt: new Date().toISOString(),
  });

  // Sign the payload so it can't be forged
  const signature = crypto
    .createHmac("sha256", QR_SECRET)
    .update(payload)
    .digest("hex")
    .substring(0, 16);

  const signedPayload = `${payload}|SIG:${signature}`;

  const qrDataUrl = await QRCode.toDataURL(signedPayload, {
    width: 300,
    margin: 2,
    color: { dark: "#1e1b4b", light: "#ffffff" },
  });

  return {
    qrDataUrl,
    qrPayload: signedPayload,
    assetId,
    boundLat: lat,
    boundLng: lng,
    issuedAt: new Date().toISOString(),
  };
}

// ─── Verify a scanned QR code against the officer's GPS ─────────────────────
const MAX_GEOFENCE_METERS = 10; // Must be within 10 meters

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function verifyQRScan(
  scannedPayload: string,
  officerLat: number,
  officerLng: number
): QRScanResult {
  try {
    // Split payload and signature
    const parts = scannedPayload.split("|SIG:");
    if (parts.length !== 2) {
      return { valid: false, withinGeofence: false, distance: -1, detail: "Invalid QR format" };
    }

    const [payloadStr, receivedSig] = parts;

    // Verify HMAC signature
    const expectedSig = crypto
      .createHmac("sha256", QR_SECRET)
      .update(payloadStr)
      .digest("hex")
      .substring(0, 16);

    if (receivedSig !== expectedSig) {
      return { valid: false, withinGeofence: false, distance: -1, detail: "QR signature verification failed — possible forgery" };
    }

    // Parse the payload
    const data = JSON.parse(payloadStr);
    const assetLat = parseFloat(data.lat);
    const assetLng = parseFloat(data.lng);

    // Check geofence
    const distance = haversine(officerLat, officerLng, assetLat, assetLng);
    const withinGeofence = distance <= MAX_GEOFENCE_METERS;

    return {
      valid: true,
      withinGeofence,
      distance: Math.round(distance),
      detail: withinGeofence
        ? `✅ Verified: Officer is ${Math.round(distance)}m from asset (within ${MAX_GEOFENCE_METERS}m geofence)`
        : `❌ Rejected: Officer is ${Math.round(distance)}m away — must be within ${MAX_GEOFENCE_METERS}m of the asset to close this ticket`,
    };
  } catch (err: any) {
    return { valid: false, withinGeofence: false, distance: -1, detail: `QR parse error: ${err.message}` };
  }
}
