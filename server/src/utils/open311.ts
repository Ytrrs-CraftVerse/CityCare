import { IIssue } from "../models/Issue";
import { AssetDiscoveryResult } from "./assetDiscovery";
import { calculatePriorityScore } from "./priorityAlgorithm";

// ─── Open311 GeoReport v2 Protocol Formatter ───────────────────────────────
// Spec: http://wiki.open311.org/GeoReport_v2/

export interface Open311ServiceRequest {
  service_request_id: string;
  service_code: string;
  service_name: string;
  description: string;
  status: "open" | "closed";
  status_notes: string;
  agency_responsible: string;
  requested_datetime: string;
  updated_datetime: string;
  address: string;
  lat: number;
  long: number;
  media_url: string | null;
  priority_score: number;
  ai_verified: boolean;
  government_asset_meta: {
    asset_id: string;
    road_name: string;
    road_type: string;
    surface: string;
    contractor: string | null;
    last_repair_date: string | null;
    warranty_active: boolean;
    repair_type: string;
    data_source: string;
  } | null;
  extended_attributes: {
    upvotes: number;
    severity: string;
    escalation_level: string;
    sentiment_score: number;
    verified_count: number;
    estimated_cost: number;
    actual_cost: number;
  };
}

const SERVICE_CODE_MAP: Record<string, { code: string; name: string }> = {
  pothole: { code: "ROAD-001", name: "Pothole Repair" },
  garbage: { code: "SANIT-001", name: "Garbage Collection" },
  streetlight: { code: "ELEC-001", name: "Streetlight Maintenance" },
  water: { code: "WATER-001", name: "Water Supply Issue" },
  other: { code: "MISC-001", name: "General Civic Issue" },
};

const STATUS_MAP: Record<string, "open" | "closed"> = {
  reported: "open",
  "in-progress": "open",
  resolved: "closed",
};

export function formatToOpen311(
  issue: IIssue,
  assetInfo: AssetDiscoveryResult | null
): Open311ServiceRequest {
  const svc = SERVICE_CODE_MAP[issue.category] || SERVICE_CODE_MAP.other;
  const [lng, lat] = issue.location.coordinates;

  const priorityScore = calculatePriorityScore(issue);

  return {
    service_request_id: `CC-${new Date(issue.createdAt).getFullYear()}-${String(issue._id).substring(18).toUpperCase()}`,
    service_code: svc.code,
    service_name: svc.name,
    description: issue.description,
    status: STATUS_MAP[issue.status] || "open",
    status_notes: `Status: ${issue.status}, Escalation: ${issue.escalationLevel}`,
    agency_responsible: assetInfo?.contractor?.agency || "Municipal Corporation",
    requested_datetime: issue.createdAt.toISOString(),
    updated_datetime: issue.updatedAt.toISOString(),
    address: issue.location.address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    lat,
    long: lng,
    media_url: issue.image || null,
    priority_score: priorityScore,
    ai_verified: true,
    government_asset_meta: assetInfo
      ? {
          asset_id: assetInfo.governmentAssetId,
          road_name: assetInfo.road.roadName,
          road_type: assetInfo.road.roadType,
          surface: assetInfo.road.surface,
          contractor: assetInfo.contractor?.contractorName || null,
          last_repair_date: assetInfo.contractor?.constructionDate || null,
          warranty_active: assetInfo.contractor?.warrantyActive || false,
          repair_type: assetInfo.contractor?.repairType || "STANDARD_WORK_ORDER",
          data_source: assetInfo.source,
        }
      : null,
    extended_attributes: {
      upvotes: issue.upvotes,
      severity: issue.severity,
      escalation_level: issue.escalationLevel,
      sentiment_score: issue.sentimentScore,
      verified_count: issue.verifiedCount,
      estimated_cost: issue.estimatedCost,
      actual_cost: issue.actualCost,
    },
  };
}

// ─── Open311 Service Discovery (required by spec) ───────────────────────────
export function getServiceList() {
  return Object.entries(SERVICE_CODE_MAP).map(([key, val]) => ({
    service_code: val.code,
    service_name: val.name,
    description: `Report ${key} related civic issues`,
    metadata: true,
    type: "realtime",
    keywords: key,
    group: "infrastructure",
  }));
}
