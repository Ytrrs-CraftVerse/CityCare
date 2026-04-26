// @ts-ignore
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { embeddingsModel } from "../utils/ollamaClient";
import Issue from "../models/Issue";

let issueVectorStore: MemoryVectorStore | null = null;
let lastRefresh = 0;

async function refreshIssueStore() {
  const now = Date.now();
  if (issueVectorStore && now - lastRefresh < 60000) return issueVectorStore;

  const activeIssues = await Issue.find({ status: { $ne: "resolved" } }).lean();

  if (activeIssues.length === 0) {
    issueVectorStore = new MemoryVectorStore(embeddingsModel);
    lastRefresh = now;
    return issueVectorStore;
  }

  const docs = activeIssues.map(
    (issue) =>
      new Document({
        pageContent: `${issue.title}. ${issue.description}. Category: ${issue.category}`,
        metadata: {
          issueId: issue._id.toString(),
          title: issue.title,
          category: issue.category,
          lat: issue.location?.coordinates?.[1],
          lng: issue.location?.coordinates?.[0],
        },
      })
  );

  issueVectorStore = await MemoryVectorStore.fromDocuments(docs, embeddingsModel);
  lastRefresh = now;
  return issueVectorStore;
}

export async function detectSemanticDuplicate(
  title: string,
  description: string,
  category: string,
  lat?: number,
  lng?: number
): Promise<{ isDuplicate: boolean; matchedIssueId?: string; similarity: number; matchedTitle?: string }> {
  const store = await refreshIssueStore();

  const queryText = `${title}. ${description}. Category: ${category}`;
  const results = await store.similaritySearchWithScore(queryText, 3);

  for (const [doc, score] of results) {
    const similarity = 1 - score;

    if (similarity < 0.82) continue;

    if (doc.metadata.category !== category) continue;

    if (lat && lng && doc.metadata.lat && doc.metadata.lng) {
      const dist = haversineDistance(lat, lng, doc.metadata.lat, doc.metadata.lng);
      if (dist > 500) continue;
    }

    return {
      isDuplicate: true,
      matchedIssueId: doc.metadata.issueId,
      similarity: Math.round(similarity * 100),
      matchedTitle: doc.metadata.title,
    };
  }

  return { isDuplicate: false, similarity: 0 };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
