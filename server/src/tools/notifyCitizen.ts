import { qwenModel } from "../utils/ollamaClient";

export async function notifyCitizen(description: string, missingFields: string[]): Promise<string> {
  const prompt = `
A citizen reported: "${description}"
This submission is too vague. We are missing: ${missingFields.join(", ")}.
Write a very short, polite 1-sentence notification asking the citizen to provide this specific information.
Do not use markdown. Just the sentence.
`;
  try {
    const res = await qwenModel.invoke([{ role: "user", content: prompt }]);
    return res.content.toString().trim();
  } catch (err) {
    return "Please provide more details for your submission.";
  }
}
