import axios from "axios";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface RoadAsset {
  osmWayId: string | null;
  roadName: string;
  roadType: string; // motorway, trunk, primary, secondary, residential, etc.
  surface: string;
  lanes: string;
  speedLimit: string;
  operator: string;
  ref: string; // Road reference number (e.g., NH-48)
}

export interface ContractorInfo {
  contractorName: string;
  constructionDate: string;
  warrantyExpiry: string;
  warrantyActive: boolean;
  defectLiabilityPeriod: number; // years
  repairType: "NO_COST_DLP_CLAIM" | "STANDARD_WORK_ORDER";
  agency: string;
}

export interface AssetDiscoveryResult {
  road: RoadAsset;
  contractor: ContractorInfo | null;
  governmentAssetId: string;
  source: string;
}

// ─── OSM Nominatim Reverse Geocode (fast primary) ──────────────────────────
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";

async function nominatimLookup(lat: number, lng: number): Promise<RoadAsset | null> {
  try {
    const res = await axios.get(NOMINATIM_URL, {
      params: { lat, lon: lng, format: "json", zoom: 18, addressdetails: 1 },
      headers: { "User-Agent": "CityCare/2.0 (citycare-smart-governance)" },
      timeout: 5000,
    });

    if (!res.data || !res.data.address) return null;

    const addr = res.data.address;
    const roadName = addr.road || addr.pedestrian || addr.street || res.data.display_name?.split(",")[0] || "Unnamed Road";

    // Nominatim doesn't give us highway class directly, but we can infer from osm_type + class
    const osmType = res.data.osm_type || "";
    const osmId = res.data.osm_id ? String(res.data.osm_id) : null;

    return {
      osmWayId: osmType === "way" ? osmId : null,
      roadName,
      roadType: res.data.type || "residential",
      surface: "unknown",
      lanes: "unknown",
      speedLimit: "unknown",
      operator: addr.municipality || addr.city_district || "Municipal Corporation",
      ref: "N/A",
    };
  } catch (err: any) {
    console.warn(`[Nominatim] Failed: ${err.message}`);
    return null;
  }
}

// ─── OSM Overpass API (detailed fallback) ───────────────────────────────────
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

async function overpassLookup(lat: number, lng: number): Promise<RoadAsset | null> {
  try {
    const query = `[out:json][timeout:8];way(around:30,${lat},${lng})["highway"];out body;`;
    const res = await axios.post(OVERPASS_URL, `data=${encodeURIComponent(query)}`, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10000,
    });

    const elements = res.data?.elements || [];
    if (elements.length === 0) return null;

    const ranked = elements.sort((a: any, b: any) => {
      const order: Record<string, number> = {
        motorway: 1, trunk: 2, primary: 3, secondary: 4,
        tertiary: 5, residential: 6, unclassified: 7, service: 8,
      };
      return (order[a.tags?.highway] || 10) - (order[b.tags?.highway] || 10);
    });

    const best = ranked[0];
    const tags = best.tags || {};

    return {
      osmWayId: String(best.id),
      roadName: tags.name || tags["name:en"] || "Unnamed Road",
      roadType: tags.highway || "unknown",
      surface: tags.surface || "unknown",
      lanes: tags.lanes || "unknown",
      speedLimit: tags.maxspeed || "unknown",
      operator: tags.operator || "Municipal Corporation",
      ref: tags.ref || "N/A",
    };
  } catch (err: any) {
    console.warn(`[Overpass] Failed: ${err.message}`);
    return null;
  }
}

// ─── Combined Road Discovery ────────────────────────────────────────────────
export async function discoverRoadAsset(lat: number, lng: number): Promise<RoadAsset> {
  // Try fast Nominatim first
  const nominatim = await nominatimLookup(lat, lng);
  if (nominatim && nominatim.osmWayId) return nominatim;

  // Fallback to detailed Overpass
  const overpass = await overpassLookup(lat, lng);
  if (overpass) return overpass;

  // If Nominatim found the road name but no way ID, still use it
  if (nominatim) return nominatim;

  return {
    osmWayId: null,
    roadName: "Road Not Found",
    roadType: "unknown",
    surface: "unknown",
    lanes: "unknown",
    speedLimit: "unknown",
    operator: "unknown",
    ref: "N/A",
  };
}

// ─── Mock PWD/NHAI Contractor Data Lake ─────────────────────────────────────
// In production, this would hit API Setu or a state PWD database.
// For now we use a realistic mock keyed on OSM road types.
const MOCK_CONTRACTORS: Record<string, Omit<ContractorInfo, "warrantyActive" | "repairType">> = {
  motorway: {
    contractorName: "L&T Infrastructure Engineering Ltd.",
    constructionDate: "2023-06-15",
    warrantyExpiry: "2026-06-15",
    defectLiabilityPeriod: 3,
    agency: "NHAI",
  },
  trunk: {
    contractorName: "IRB Infrastructure Developers",
    constructionDate: "2024-01-20",
    warrantyExpiry: "2027-01-20",
    defectLiabilityPeriod: 3,
    agency: "NHAI",
  },
  primary: {
    contractorName: "Ashoka Buildcon Ltd.",
    constructionDate: "2022-09-01",
    warrantyExpiry: "2025-09-01",
    defectLiabilityPeriod: 3,
    agency: "State PWD",
  },
  secondary: {
    contractorName: "Dilip Buildcon Ltd.",
    constructionDate: "2023-11-10",
    warrantyExpiry: "2026-11-10",
    defectLiabilityPeriod: 3,
    agency: "State PWD",
  },
  tertiary: {
    contractorName: "Sadbhav Engineering Ltd.",
    constructionDate: "2024-03-05",
    warrantyExpiry: "2027-03-05",
    defectLiabilityPeriod: 3,
    agency: "Municipal Corporation",
  },
  residential: {
    contractorName: "Hindustan Construction Co.",
    constructionDate: "2024-08-22",
    warrantyExpiry: "2027-08-22",
    defectLiabilityPeriod: 3,
    agency: "Ward Office",
  },
};

export function lookupContractorInfo(roadType: string): ContractorInfo | null {
  const base = MOCK_CONTRACTORS[roadType];
  if (!base) return null;

  const now = new Date();
  const warrantyExpiry = new Date(base.warrantyExpiry);
  const warrantyActive = now < warrantyExpiry;

  return {
    ...base,
    warrantyActive,
    repairType: warrantyActive ? "NO_COST_DLP_CLAIM" : "STANDARD_WORK_ORDER",
  };
}

// ─── Full Asset Discovery Pipeline ──────────────────────────────────────────
export async function discoverAsset(lat: number, lng: number): Promise<AssetDiscoveryResult> {
  const road = await discoverRoadAsset(lat, lng);
  const contractor = lookupContractorInfo(road.roadType);

  // Generate a deterministic Asset ID
  const assetId = road.osmWayId
    ? `OSM-${road.osmWayId}`
    : `GPS-${lat.toFixed(4)}-${lng.toFixed(4)}`;

  return {
    road,
    contractor,
    governmentAssetId: assetId,
    source: road.osmWayId ? "OpenStreetMap Overpass API" : "GPS Coordinates (no road found)",
  };
}
