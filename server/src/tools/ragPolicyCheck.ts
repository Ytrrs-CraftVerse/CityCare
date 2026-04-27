import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { embeddingsModel, qwenModel } from "../utils/ollamaClient";
import fs from "fs";
import path from "path";

let vectorStore: MemoryVectorStore | null = null;

async function initVectorStore() {
  if (vectorStore) return vectorStore;
  
  const bylawsPath = path.join(__dirname, "../../data/bylaws.txt");
  const text = fs.readFileSync(bylawsPath, "utf-8");
  
  const chunks = text.split(/\n\s*\n/).filter(c => c.trim().length > 0);
  
  const docs = chunks.map(chunk => new Document({ pageContent: chunk }));
  
  vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddingsModel);
  return vectorStore;
}

export async function ragPolicyCheck(description: string): Promise<{ isCityResponsibility: boolean, reason: string }> {
  const store = await initVectorStore();
  
  const results = await store.similaritySearch(description, 2);
  const contextText = results.map((r: any) => r.pageContent).join("\n---\n");
  
  const prompt = `You are a municipal policy enforcement agent.
A citizen has reported the following issue:
"${description}"

Here are the retrieved official city bylaws relevant to this issue:
---
${contextText}
---

Based STRICTLY on the bylaws provided, is the city legally responsible for fixing this issue, or does it fall under private responsibility or some other exception?
Respond in exactly two lines.
Line 1: Either "YES" or "NO".
Line 2: A short 1-sentence explanation of why based on the bylaw.`;

  try {
    const res = await qwenModel.invoke([{ role: "user", content: prompt }]);
    const lines = res.content.toString().trim().split("\n");
    const isCity = lines[0].toUpperCase().includes("YES");
    const reason = lines[1] || "Policy decision based on municipal bylaws.";
    return { isCityResponsibility: isCity, reason };
  } catch (err) {
    console.error("RAG Policy Check Failed", err);
    return { isCityResponsibility: true, reason: "Fallback: Assuming city responsibility due to RAG failure." };
  }
}
