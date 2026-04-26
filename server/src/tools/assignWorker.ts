export async function assignWorker(category: string, priority: number): Promise<string> {
  const department = category === "water" ? "WaterWorks" : category === "streetlight" ? "Electrical" : "Roads";
  const misPrefix = department.substring(0, 3).toUpperCase();
  const workerMIS = `${misPrefix}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  return workerMIS;
}
