import { qwenModel } from "../utils/ollamaClient";

export async function classifyIssue(description: string): Promise<{ category: string; priority: number; isVague: boolean; missingFields: string[] }> {
  const prompt = `
Analyze the following civic complaint: "${description}"
You must respond ONLY with a valid JSON object, no markdown, no other text.
Determine:
1. category: string (pothole, streetlight, garbage, water, or other)
2. priority: number (0-100)
3. isVague: boolean (true if location, subject, or core issue is completely missing)
4. missingFields: string[] (list of missing data like "location", "photo", "specific issue description")

JSON Format:
{"category": "pothole", "priority": 80, "isVague": false, "missingFields": []}
`;
  try {
    const res = await qwenModel.invoke([{ role: "user", content: prompt }]);
    let content = res.content.toString();
    if (content.includes("\`\`\`json")) {
        content = content.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    }
    return JSON.parse(content);
  } catch (err) {
    return { category: "other", priority: 50, isVague: true, missingFields: ["description"] };
  }
}
