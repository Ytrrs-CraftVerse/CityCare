import cron from "node-cron";
import Issue from "../models/Issue";
import { createAuditEntry } from "./auditTrail";
import Notification from "../models/Notification";
import User from "../models/User";

export const startEscalationCron = (): void => {
  cron.schedule("0 * * * *", async () => {
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const issues = await Issue.find({
        status: "reported",
        priority: { $gte: 4 },
        escalationLevel: "normal",
        createdAt: { $lte: fortyEightHoursAgo },
      });

      for (const issue of issues) {
        issue.escalationLevel = "critical";
        issue.escalatedAt = new Date();
        await issue.save();

        await createAuditEntry({
          issueId: issue._id,
          action: "escalated",
          performedByName: "Auto-Escalation System",
          previousValue: "normal",
          newValue: "critical",
          details: `High-priority issue not addressed within 48 hours. Auto-escalated to CRITICAL.`,
        });

        const superAdmins = await User.find({ role: "super-admin" });
        for (const admin of superAdmins) {
          await Notification.create({
            userId: admin._id,
            type: "escalation",
            message: `🔴 CRITICAL: "${issue.title}" has not been addressed for 48+ hours`,
            issueId: issue._id,
          });
        }

        console.log(`⚡ Auto-escalated issue: ${issue.title}`);
      }

      if (issues.length > 0) {
        console.log(`🔔 Escalated ${issues.length} overdue high-priority issues`);
      }
    } catch (err: any) {
      console.error("Escalation cron error:", err.message);
    }
  });

  console.log("📋 Auto-escalation cron job started (runs every hour)");
};
