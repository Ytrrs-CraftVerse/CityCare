import { ragPolicyCheck } from "../tools/ragPolicyCheck";

export async function policyAgent(state: any): Promise<any> {
  const policy = await ragPolicyCheck(state.description);
  
  if (!policy.isCityResponsibility) {
    return {
      status: "rejected",
      history: [`Policy Agent (RAG): Rejected. ${policy.reason}`]
    };
  }

  return {
    status: "dispatch",
    history: [`Policy Agent (RAG): Approved. ${policy.reason}`]
  };
}
