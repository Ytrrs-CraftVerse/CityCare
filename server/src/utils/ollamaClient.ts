import { ChatOllama } from "@langchain/ollama";
import { OllamaEmbeddings } from "@langchain/ollama";

export const qwenModel = new ChatOllama({
  baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  model: "qwen2.5-coder:7b",
  temperature: 0.1,
});

export const llavaModel = new ChatOllama({
  baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  model: "llava",
  temperature: 0.1,
});

export const embeddingsModel = new OllamaEmbeddings({
  baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  model: "nomic-embed-text",
});
