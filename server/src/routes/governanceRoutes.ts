import { Router, Request, Response, NextFunction } from "express";
import Issue from "../models/Issue";
import { discoverAsset } from "../utils/assetDiscovery";
import { formatToOpen311, getServiceList } from "../utils/open311";
import { runForensics } from "../utils/forensics";
import { generateAssetQR, verifyQRScan } from "../utils/qrGeofence";
import { recalculateAllPriorities } from "../utils/priorityAlgorithm";

const router = Router();

// ─── Open311: Service Discovery ─────────────────────────────────────────────
router.get("/services", (_req: Request, res: Response) => {
  res.json(getServiceList());
});

// ─── Open311: Get Single Request ────────────────────────────────────────────
router.get("/requests/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      res.status(404).json({ message: "Service request not found" });
      return;
    }

    const [lng, lat] = issue.location.coordinates;
    const assetInfo = await discoverAsset(lat, lng);
    const open311 = formatToOpen311(issue, assetInfo);

    res.json(open311);
  } catch (err) {
    next(err);
  }
});

// ─── Open311: Get All Requests ──────────────────────────────────────────────
router.get("/requests", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, service_code } = req.query;
    const query: Record<string, any> = {};

    if (status === "open") query.status = { $in: ["reported", "in-progress"] };
    if (status === "closed") query.status = "resolved";
    if (service_code) {
      const codeMap: Record<string, string> = {
        "ROAD-001": "pothole",
        "SANIT-001": "garbage",
        "ELEC-001": "streetlight",
        "WATER-001": "water",
        "MISC-001": "other",
      };
      query.category = codeMap[service_code as string] || "other";
    }

    const issues = await Issue.find(query).sort({ createdAt: -1 }).limit(50);

    // For bulk listing, skip OSM lookup to avoid rate limiting
    const results = issues.map((issue) => formatToOpen311(issue, null));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// ─── Asset Discovery Endpoint ───────────────────────────────────────────────
router.get("/asset-lookup", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ message: "lat and lng query params are required" });
      return;
    }

    const result = await discoverAsset(lat, lng);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── Photo Forensics Endpoint ───────────────────────────────────────────────
router.post("/verify-photo", (req: Request, res: Response) => {
  const { reportedLat, reportedLng, exifLat, exifLng, exifTimestamp } = req.body;

  if (reportedLat == null || reportedLng == null) {
    res.status(400).json({ message: "reportedLat and reportedLng are required" });
    return;
  }

  const result = runForensics(reportedLat, reportedLng, {
    exifLat,
    exifLng,
    exifTimestamp,
  });

  res.json(result);
});

// ─── QR Code Generation for an Issue ────────────────────────────────────────
router.post("/qr/generate/:issueId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issue = await Issue.findById(req.params.issueId);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    const [lng, lat] = issue.location.coordinates;
    const assetInfo = await discoverAsset(lat, lng);
    const qr = await generateAssetQR(
      String(issue._id),
      assetInfo.governmentAssetId,
      lat,
      lng
    );

    res.json(qr);
  } catch (err) {
    next(err);
  }
});

// ─── QR Code Scan Verification (Proof of Fix) ──────────────────────────────
router.post("/qr/verify", (req: Request, res: Response) => {
  const { scannedPayload, officerLat, officerLng } = req.body;

  if (!scannedPayload || officerLat == null || officerLng == null) {
    res.status(400).json({ message: "scannedPayload, officerLat, officerLng required" });
    return;
  }

  const result = verifyQRScan(scannedPayload, officerLat, officerLng);
  res.json(result);
});

// ─── Priority Recalculation Trigger ─────────────────────────────────────────
router.post("/recalculate-priorities", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await recalculateAllPriorities();
    res.json({ message: `Recalculated priorities for ${updated} issues` });
  } catch (err) {
    next(err);
  }
});

export default router;
