import { StateGraph, END } from "@langchain/langgraph";
import { ComplaintState } from "../workflows/complaintFlow";
import { triageAgent } from "./triageAgent";
import { dispatchAgent } from "./dispatchAgent";
import { escalationAgent } from "./escalationAgent";
import fs from "fs";
import path from "path";

const historyPath = path.join(__dirname, "../../data/history.json");

function logToHistory(state: any) {
  let logs: any[] = [];
  try {
    if (fs.existsSync(historyPath)) {
      logs = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    }
  } catch {}
  logs.push({ timestamp: new Date().toISOString(), state });
  fs.writeFileSync(historyPath, JSON.stringify(logs, null, 2));
}

const triageNode = async (state: typeof ComplaintState.State) => {
  const result = await triageAgent(state);
  return result;
};

const dispatchNode = async (state: typeof ComplaintState.State) => {
  const result = await dispatchAgent(state);
  return result;
};

const escalationNode = async (state: typeof ComplaintState.State) => {
  const result = await escalationAgent(state);
  return result;
};

const routeFromTriage = (state: typeof ComplaintState.State) => {
  if (state.status === "clarification") return END;
  return "dispatch";
};

const routeFromDispatch = (state: typeof ComplaintState.State) => {
  return "escalation";
};

const workflow = new StateGraph(ComplaintState)
  .addNode("triage", triageNode)
  .addNode("dispatch", dispatchNode)
  .addNode("escalation", escalationNode)
  .addEdge("__start__", "triage")
  .addConditionalEdges("triage", routeFromTriage)
  .addConditionalEdges("dispatch", routeFromDispatch)
  .addEdge("escalation", END);

export const supervisorAgent = workflow.compile();

export async function processComplaint(initialState: Partial<typeof ComplaintState.State>) {
  const result = await supervisorAgent.invoke(initialState);
  logToHistory(result);
  return result;
}
