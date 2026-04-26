import { assignWorker } from "../tools/assignWorker";
import { predictHotspots } from "../tools/predictHotspots";

export async function dispatchAgent(state: any): Promise<any> {
  const isHotspot = await predictHotspots(state.category, "unknown");
  const assignedMIS = await assignWorker(state.category, state.priority);

  let newPriority = state.priority;
  if (isHotspot) {
    newPriority = Math.min(100, state.priority + 20);
  }

  return {
    assignedTo: assignedMIS,
    priority: newPriority,
    status: "verification",
    history: [`Dispatch: Assigned to worker ${assignedMIS}${isHotspot ? ' (Hotspot detected, bumped priority)' : ''}`]
  };
}
