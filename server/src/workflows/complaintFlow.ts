import { Annotation } from "@langchain/langgraph";

export const ComplaintState = Annotation.Root({
  complaintId: Annotation<string>(),
  MIS: Annotation<string>(),
  description: Annotation<string>(),
  images: Annotation<string[]>(),
  category: Annotation<string | null>(),
  priority: Annotation<number>(),
  missingData: Annotation<string[]>(),
  status: Annotation<"triage" | "clarification" | "dispatch" | "verification" | "resolved" | "escalated">(),
  assignedTo: Annotation<string | null>(),
  history: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});
