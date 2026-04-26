import { classifyIssue } from "../tools/classifyIssue";
import { notifyCitizen } from "../tools/notifyCitizen";

export async function triageAgent(state: any): Promise<any> {
  const classification = await classifyIssue(state.description);
  
  if (classification.isVague) {
    const clarificationMsg = await notifyCitizen(state.description, classification.missingFields);
    return {
      status: "clarification",
      missingData: classification.missingFields,
      history: [`Triage: Deemed vague. Clarification requested: ${clarificationMsg}`]
    };
  }

  return {
    category: classification.category,
    priority: classification.priority,
    status: "dispatch",
    history: [`Triage: Classified as ${classification.category} with priority ${classification.priority}`]
  };
}
