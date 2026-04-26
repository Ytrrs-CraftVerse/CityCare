import { llavaModel } from "../utils/ollamaClient";
import fs from "fs";

export async function visualVerify(originalImagePath: string, resolutionImagePath: string): Promise<boolean> {
  try {
    const origBase64 = fs.readFileSync(originalImagePath).toString("base64");
    const resBase64 = fs.readFileSync(resolutionImagePath).toString("base64");

    const prompt = "Look at these two images. The first is a reported civic issue (like a pothole or garbage). The second is the repair. Has the issue been genuinely fixed? Answer ONLY with 'YES' or 'NO'.";

    const response = await llavaModel.invoke([
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${origBase64}` } },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${resBase64}` } }
        ]
      }
    ]);
    
    return response.content.toString().trim().toUpperCase().includes("YES");
  } catch (err) {
    console.error("Llava visual verification failed:", err);
    return false;
  }
}
