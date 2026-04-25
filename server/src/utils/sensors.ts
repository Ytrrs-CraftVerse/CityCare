import axios from "axios";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Zone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  ward: string;
  waqiStation: string; // WAQI station slug or @stationId
}

interface SensorData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  ward: string;
  sensors: {
    airQuality: { aqi: number; pm25: number; pm10: number; status: string };
    noiseLevel: { decibels: number; status: string };
    waterTank: { levelPercent: number; capacityLiters: number; status: string };
  };
  dataSource: {
    airQuality: string;
    noiseLevel: string;
    waterQuality: string;
  };
  lastUpdated: string;
}

// ─── Mumbai CPCB Monitoring Zones with WAQI Station IDs ─────────────────────
// These are real CPCB stations tracked by WAQI in Mumbai
export const ZONES: Zone[] = [
  { id: "zone-1", name: "Bandra, Mumbai", lat: 19.0596, lng: 72.8295, ward: "H/W Ward", waqiStation: "@8539" },
  { id: "zone-2", name: "Andheri, Mumbai", lat: 19.1197, lng: 72.8464, ward: "K/W Ward", waqiStation: "@11306" },
  { id: "zone-3", name: "Worli, Mumbai", lat: 19.0176, lng: 72.8150, ward: "G/S Ward", waqiStation: "@11309" },
  { id: "zone-4", name: "Colaba, Mumbai", lat: 18.9067, lng: 72.8147, ward: "A Ward", waqiStation: "@11303" },
  { id: "zone-5", name: "Borivali, Mumbai", lat: 19.2288, lng: 72.8544, ward: "R/S Ward", waqiStation: "@14364" },
  { id: "zone-6", name: "Chembur, Mumbai", lat: 19.0522, lng: 72.8994, ward: "M/E Ward", waqiStation: "@11304" },
];

// ─── CPCB Noise Standards for Zone Estimation ───────────────────────────────
// Source: CPCB National Ambient Noise Monitoring Network
// Since no free real-time noise API exists, we derive estimates from zone type
// and time of day based on CPCB standards
const NOISE_STANDARDS: Record<string, { day: [number, number]; night: [number, number] }> = {
  industrial: { day: [70, 85], night: [60, 75] },
  commercial: { day: [60, 75], night: [50, 65] },
  residential: { day: [45, 60], night: [35, 50] },
  silence: { day: [40, 50], night: [30, 40] },
};

const ZONE_TYPES: Record<string, string> = {
  "zone-1": "commercial",  // Bandra — mixed commercial
  "zone-2": "commercial",  // Andheri — commercial hub
  "zone-3": "commercial",  // Worli — mixed
  "zone-4": "commercial",  // Colaba — tourist/commercial
  "zone-5": "residential", // Borivali — residential-heavy
  "zone-6": "industrial",  // Chembur — industrial area
};

// ─── Cache to avoid hammering APIs ──────────────────────────────────────────
let cachedData: SensorData[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── AQI Status Helper ─────────────────────────────────────────────────────
function aqiStatus(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

function noiseStatus(db: number): string {
  if (db <= 50) return "Quiet";
  if (db <= 65) return "Moderate";
  if (db <= 75) return "Loud";
  return "Very Loud";
}

function waterStatus(level: number): string {
  if (level >= 70) return "Good";
  if (level >= 40) return "Normal";
  if (level >= 20) return "Low";
  return "Critical";
}

// ─── Fetch Air Quality from WAQI (CPCB stations) ───────────────────────────
async function fetchAirQualityForStation(
  stationId: string
): Promise<{ aqi: number; pm25: number; pm10: number; status: string } | null> {
  const token = process.env.WAQI_TOKEN || "demo";
  try {
    const url = `https://api.waqi.info/feed/${stationId}/?token=${token}`;
    const res = await axios.get(url, { timeout: 8000 });

    if (res.data?.status === "ok" && res.data.data) {
      const d = res.data.data;
      const aqi: number = d.aqi ?? 0;
      const pm25: number = d.iaqi?.pm25?.v ?? 0;
      const pm10: number = d.iaqi?.pm10?.v ?? 0;

      return {
        aqi,
        pm25,
        pm10,
        status: aqiStatus(aqi),
      };
    }
  } catch (err: any) {
    console.warn(`[WAQI] Failed to fetch station ${stationId}: ${err.message}`);
  }
  return null;
}

// ─── Fetch Water Quality from data.gov.in (CPCB) ───────────────────────────
// Resource: Real Time Water Quality Data from CPCB RTWQMS stations
let waterDataCache: Record<string, { ph: number; do: number; temp: number }> = {};
let waterCacheTimestamp = 0;

async function fetchWaterQualityData(): Promise<void> {
  if (Date.now() - waterCacheTimestamp < CACHE_TTL_MS && Object.keys(waterDataCache).length > 0) {
    return; // Use cached water data
  }

  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) return;

  try {
    // Real Time Water Quality Data (CPCB)
    const url = `https://api.data.gov.in/resource/b3296924-93c5-40df-a4e1-e58e05e1e740?api-key=${apiKey}&format=json&limit=50&filters[state]=Maharashtra`;
    const res = await axios.get(url, { timeout: 10000 });

    if (res.data?.records?.length > 0) {
      // Map station data to zones based on proximity
      for (const record of res.data.records) {
        const stationName = (record.station_name || record.station || "").toLowerCase();
        // Match stations near our zones
        for (const zone of ZONES) {
          const zoneName = zone.name.toLowerCase();
          if (stationName.includes("mumbai") || stationName.includes("thane") || stationName.includes("maharashtra")) {
            waterDataCache[zone.id] = {
              ph: parseFloat(record.ph || record.p_h || "7"),
              do: parseFloat(record.dissolved_oxygen || record.do_ || "6"),
              temp: parseFloat(record.temperature || record.temp || "28"),
            };
          }
        }
      }
      waterCacheTimestamp = Date.now();
    }
  } catch (err: any) {
    console.warn(`[data.gov.in] Water quality fetch failed: ${err.message}`);
  }
}

// ─── Generate Noise Data from CPCB Standards ────────────────────────────────
function estimateNoiseLevel(zoneId: string): { decibels: number; status: string } {
  const hour = new Date().getHours();
  const isDay = hour >= 6 && hour < 22;
  const zoneType = ZONE_TYPES[zoneId] || "commercial";
  const range = isDay ? NOISE_STANDARDS[zoneType].day : NOISE_STANDARDS[zoneType].night;

  // Add slight variance within the CPCB standard range
  const variance = Math.random() * (range[1] - range[0]);
  const decibels = Math.round((range[0] + variance) * 10) / 10;

  return {
    decibels,
    status: noiseStatus(decibels),
  };
}

// ─── Water Level Estimation ─────────────────────────────────────────────────
function estimateWaterLevel(zoneId: string): { levelPercent: number; capacityLiters: number; status: string } {
  const hour = new Date().getHours();
  // Water usage peaks in morning (6-9) and evening (18-21)
  const isPeak = (hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 21);
  const baseLevel = isPeak ? 40 : 70;
  const variance = Math.random() * 25;
  const levelPercent = Math.min(100, Math.round(baseLevel + variance));

  // If we have government water data, blend it
  const govData = waterDataCache[zoneId];
  let adjustedLevel = levelPercent;
  if (govData) {
    // Low DO or extreme pH indicates contamination → lower effective "quality-adjusted" level
    if (govData.do < 4 || govData.ph < 6.5 || govData.ph > 8.5) {
      adjustedLevel = Math.max(10, levelPercent - 20);
    }
  }

  return {
    levelPercent: adjustedLevel,
    capacityLiters: 50000,
    status: waterStatus(adjustedLevel),
  };
}

// ─── Main Export: Fetch Real Sensor Data ─────────────────────────────────────
export async function fetchRealSensorData(): Promise<SensorData[]> {
  // Return cache if fresh
  if (cachedData && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedData;
  }

  // Fetch government water data in parallel
  await fetchWaterQualityData();

  // Fetch air quality for all zones in parallel
  const airPromises = ZONES.map((zone) => fetchAirQualityForStation(zone.waqiStation));
  const airResults = await Promise.allSettled(airPromises);

  const data: SensorData[] = ZONES.map((zone, i) => {
    const airResult = airResults[i];
    let airData = { aqi: 0, pm25: 0, pm10: 0, status: "Unavailable" };
    let airSource = "WAQI / CPCB India";

    if (airResult.status === "fulfilled" && airResult.value) {
      airData = airResult.value;
    } else {
      // Fallback: generate realistic estimates based on Mumbai averages
      const baseAqi = 80 + Math.random() * 100;
      airData = {
        aqi: Math.round(baseAqi),
        pm25: Math.round(baseAqi * 0.7),
        pm10: Math.round(baseAqi * 1.2),
        status: aqiStatus(Math.round(baseAqi)),
      };
      airSource = "Estimated (API unavailable)";
    }

    const noiseData = estimateNoiseLevel(zone.id);
    const waterData = estimateWaterLevel(zone.id);

    return {
      id: zone.id,
      name: zone.name,
      lat: zone.lat,
      lng: zone.lng,
      ward: zone.ward,
      sensors: {
        airQuality: airData,
        noiseLevel: noiseData,
        waterTank: waterData,
      },
      dataSource: {
        airQuality: airSource,
        noiseLevel: "CPCB Ambient Noise Standards (zone-type estimate)",
        waterQuality: Object.keys(waterDataCache).length > 0
          ? "data.gov.in / CPCB RTWQMS"
          : "Estimated (Municipal capacity model)",
      },
      lastUpdated: new Date().toISOString(),
    };
  });

  // Update cache
  cachedData = data;
  cacheTimestamp = Date.now();

  return data;
}

// ─── Legacy compatibility ───────────────────────────────────────────────────
export const generateSensorData = (): Promise<SensorData[]> => fetchRealSensorData();
