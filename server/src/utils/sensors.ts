interface Zone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  ward: string;
}

interface SensorData extends Zone {
  sensors: {
    airQuality: { aqi: number; pm25: number; pm10: number; status: string };
    noiseLevel: { decibels: number; status: string };
    waterTank: { levelPercent: number; capacityLiters: number; status: string };
  };
  lastUpdated: string;
}

export const ZONES: Zone[] = [
  { id: "zone-1", name: "Central Mumbai", lat: 19.076, lng: 72.877, ward: "Ward 1" },
  { id: "zone-2", name: "Andheri West", lat: 19.136, lng: 72.836, ward: "Ward 4" },
  { id: "zone-3", name: "Bandra East", lat: 19.06, lng: 72.85, ward: "Ward 2" },
  { id: "zone-4", name: "Dadar", lat: 19.018, lng: 72.844, ward: "Ward 3" },
  { id: "zone-5", name: "Powai", lat: 19.119, lng: 72.906, ward: "Ward 5" },
  { id: "zone-6", name: "Malad", lat: 19.186, lng: 72.849, ward: "Ward 6" },
];

const randomInRange = (min: number, max: number): number =>
  Math.round((Math.random() * (max - min) + min) * 10) / 10;

export const generateSensorData = (): SensorData[] => {
  return ZONES.map((zone) => ({
    ...zone,
    sensors: {
      airQuality: {
        aqi: randomInRange(30, 250),
        pm25: randomInRange(10, 150),
        pm10: randomInRange(20, 200),
        status:
          randomInRange(0, 1) > 0.7
            ? "Poor"
            : randomInRange(0, 1) > 0.4
            ? "Moderate"
            : "Good",
      },
      noiseLevel: {
        decibels: randomInRange(35, 95),
        status:
          randomInRange(0, 1) > 0.6
            ? "Loud"
            : randomInRange(0, 1) > 0.3
            ? "Moderate"
            : "Quiet",
      },
      waterTank: {
        levelPercent: randomInRange(10, 100),
        capacityLiters: 50000,
        status:
          randomInRange(0, 1) > 0.7
            ? "Low"
            : randomInRange(0, 1) > 0.3
            ? "Normal"
            : "Full",
      },
    },
    lastUpdated: new Date().toISOString(),
  }));
};
