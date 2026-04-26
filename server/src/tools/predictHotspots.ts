import { qwenModel } from "../utils/ollamaClient";

export async function predictHotspots(category: string, location: any): Promise<boolean> {
  const prompt = `
We have a new issue in category "${category}" near ${JSON.stringify(location)}.
Based on general urban patterns, is this likely a recurring hotspot? Answer only "YES" or "NO".
`;
  try {
    const res = await qwenModel.invoke([{ role: "user", content: prompt }]);
    return res.content.toString().trim().toUpperCase().includes("YES");
  } catch {
    return false;
  }
}
