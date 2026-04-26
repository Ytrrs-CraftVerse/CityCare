import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Issue from "../models/Issue";
import User from "../models/User";
import Notification from "../models/Notification";
import AuditLog from "../models/AuditLog";
import { createAuditEntry, verifyAuditChain } from "../utils/auditTrail";
import { analyzeSentiment, shouldAutoBumpPriority } from "../utils/sentiment";
import { suggestCategory, estimateSeverity } from "../utils/categorize";
import { discoverAsset } from "../utils/assetDiscovery";
import { processComplaint } from "../agents/supervisorAgent";

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const createIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, category, location, image } = req.body;

    if (!location || location.lat == null || location.lng == null) {
      res.status(400).json({ message: "Location is required" });
      return;
    }

    const sentimentScore = analyzeSentiment(`${title} ${description}`);
    const severity = estimateSeverity(`${title} ${description}`);
    let priority: number = req.body.priority || 1;
    const autoPriority = shouldAutoBumpPriority(sentimentScore);
    if (autoPriority > priority) priority = autoPriority;

    const issue = new Issue({
      title,
      description,
      category,
      location: {
        type: "Point",
        coordinates: [location.lng, location.lat],
        address: location.address,
      },
      image,
      reportedBy: req.user?._id ?? null,
      reportedByName: req.user?.name ?? "Anonymous",
      sentimentScore,
      severity,
      priority,
    });

    // Phase 1: Auto-discover road asset + contractor from OSM/Gov APIs
    try {
      const assetInfo = await discoverAsset(location.lat, location.lng);
      issue.governmentAsset = {
        assetId: assetInfo.governmentAssetId,
        roadName: assetInfo.road.roadName,
        roadType: assetInfo.road.roadType,
        surface: assetInfo.road.surface,
        contractor: assetInfo.contractor?.contractorName || "Unknown",
        constructionDate: assetInfo.contractor?.constructionDate || "Unknown",
        warrantyActive: assetInfo.contractor?.warrantyActive || false,
        repairType: assetInfo.contractor?.repairType || "STANDARD_WORK_ORDER",
        agency: assetInfo.contractor?.agency || "Municipal Corporation",
        source: assetInfo.source,
      };
    } catch (assetErr: any) {
      console.warn("[AssetDiscovery] Failed:", assetErr.message);
    }

    const created = await issue.save();

    try {
      const agentResult = await processComplaint({
        complaintId: created._id.toString(),
        MIS: req.user?._id.toString() || "Anonymous",
        description: `${title}: ${description}`,
        images: image ? [image] : [],
        priority: priority,
      });

      if (agentResult.category && agentResult.category !== category) {
        created.category = agentResult.category as any;
      }
      if (agentResult.priority) {
        created.priority = agentResult.priority;
      }
      if (agentResult.assignedTo) {
        created.assignedTo = agentResult.assignedTo as any;
      }
      await created.save();
    } catch (agentErr) {
      console.error("Agent workflow failed:", agentErr);
    }

    await createAuditEntry({
      issueId: created._id,
      action: "created",
      performedBy: req.user?._id ?? null,
      performedByName: req.user?.name ?? "Anonymous",
      newValue: `${title} [${category}]`,
      details: `Issue created with severity: ${severity}, sentiment: ${sentimentScore}`,
    });

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { reputationScore: 5 } });
    }

    // Neighborhood watch notifications
    try {
      const watchers = await User.find({
        watchRadius: { $gt: 0 },
        "watchLocation.coordinates": { $ne: [0, 0] },
      });

      for (const watcher of watchers) {
        if (req.user && watcher._id.equals(req.user._id)) continue;

        const [wLng, wLat] = watcher.watchLocation.coordinates;
        const distance = getDistanceMeters(wLat, wLng, location.lat, location.lng);

        if (distance <= watcher.watchRadius) {
          await Notification.create({
            userId: watcher._id,
            type: "nearby-issue",
            message: `New ${category} issue reported near you: "${title}"`,
            issueId: created._id,
          });
        }
      }
    } catch (notifErr: any) {
      console.error("Notification error:", notifErr.message);
    }

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

export const getIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, status, search, sortBy } = req.query;
    const query: Record<string, any> = {};

    if (category && category !== "all") query.category = category;
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    let sort: Record<string, any> = { createdAt: -1 };
    if (sortBy === "priority") sort = { priority: -1, sentimentScore: -1 };
    if (sortBy === "upvotes") sort = { upvotes: -1 };

    const issues = await Issue.find(query).sort(sort);
    res.json(issues);
  } catch (err) {
    next(err);
  }
};

export const getIssueById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id as string)) {
      res.status(400).json({ message: "Invalid ID" });
      return;
    }
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }
    res.json(issue);
  } catch (err) {
    next(err);
  }
};

export const updateIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const oldIssue = await Issue.findById(req.params.id);
    if (!oldIssue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    const updates = { ...req.body };
    
    // Agentic visual verification if being marked resolved
    if (updates.status === "resolved" && oldIssue.status !== "resolved") {
      if (updates.resolutionImage && oldIssue.image) {
        const { visualVerify } = await import("../tools/visualVerify");
        const path = await import("path");
        const origPath = path.join(__dirname, "../../", oldIssue.image);
        const resPath = path.join(__dirname, "../../", updates.resolutionImage);
        
        try {
          const isVerified = await visualVerify(origPath, resPath);
          if (!isVerified) {
            res.status(400).json({ message: "Agent rejected the resolution. Visual proof does not match the original issue." });
            return;
          }
          updates.visualVerified = true;
        } catch (e) {
          console.warn("Visual verification error:", e);
        }
      }
    }

    const issue = await Issue.findByIdAndUpdate(req.params.id, updates, { new: true });

    if (req.body.status && req.body.status !== oldIssue.status) {
      await createAuditEntry({
        issueId: issue!._id,
        action: req.body.status === "resolved" ? "resolved" : "status-changed",
        performedBy: req.user?._id ?? null,
        performedByName: req.user?.name ?? "Admin",
        previousValue: oldIssue.status,
        newValue: req.body.status,
        details: `Status changed from ${oldIssue.status} to ${req.body.status}`,
      });
    }

    if (req.body.estimatedCost !== undefined || req.body.actualCost !== undefined) {
      await createAuditEntry({
        issueId: issue!._id,
        action: "cost-updated",
        performedBy: req.user?._id ?? null,
        performedByName: req.user?.name ?? "Admin",
        previousValue: `est: ₹${oldIssue.estimatedCost}, actual: ₹${oldIssue.actualCost}`,
        newValue: `est: ₹${issue!.estimatedCost}, actual: ₹${issue!.actualCost}`,
      });
    }

    res.json(issue);
  } catch (err) {
    next(err);
  }
};

export const deleteIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    await createAuditEntry({
      issueId: issue._id,
      action: "deleted",
      performedBy: req.user?._id ?? null,
      performedByName: req.user?.name ?? "Admin",
      details: `Issue "${issue.title}" marked as deleted (audit preserved)`,
    });

    await Issue.findByIdAndDelete(req.params.id);
    res.json({ message: "Issue deleted (audit trail preserved)" });
  } catch (err) {
    next(err);
  }
};

export const upvoteIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    const userId = req.user!._id;
    const alreadyUpvoted = issue.upvotedBy.some((id) => id.equals(userId));

    if (alreadyUpvoted) {
      issue.upvotedBy = issue.upvotedBy.filter((id) => !id.equals(userId));
      issue.upvotes = Math.max(0, issue.upvotes - 1);
    } else {
      issue.upvotedBy.push(userId);
      issue.upvotes += 1;
    }

    await issue.save();
    res.json(issue);
  } catch (err) {
    next(err);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    const { text } = req.body;
    const sentimentScore = analyzeSentiment(text);

    issue.comments.push({
      user: req.user!._id,
      userName: req.user!.name,
      text,
      sentimentScore,
      createdAt: new Date(),
    });

    const maxSentiment = Math.max(issue.sentimentScore, sentimentScore);
    issue.sentimentScore = maxSentiment;

    const autoPriority = shouldAutoBumpPriority(maxSentiment);
    if (autoPriority > issue.priority) {
      issue.priority = autoPriority;
    }

    await issue.save();

    await createAuditEntry({
      issueId: issue._id,
      action: "comment-added",
      performedBy: req.user!._id,
      performedByName: req.user!.name,
      newValue: text.substring(0, 100),
      details: `Comment sentiment score: ${sentimentScore}`,
    });

    await User.findByIdAndUpdate(req.user!._id, { $inc: { reputationScore: 2 } });

    res.json(issue);
  } catch (err) {
    next(err);
  }
};

export const verifyIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      res.status(404).json({ message: "Issue not found" });
      return;
    }

    if (req.user!.reputationScore < 50) {
      res.status(403).json({ message: "You need at least 50 reputation points to verify issues" });
      return;
    }

    if (issue.verifiedBy.some((id) => id.equals(req.user!._id))) {
      res.status(400).json({ message: "You already verified this issue" });
      return;
    }

    issue.verifiedBy.push(req.user!._id);
    issue.verifiedCount += 1;
    await issue.save();

    await createAuditEntry({
      issueId: issue._id,
      action: "verified",
      performedBy: req.user!._id,
      performedByName: req.user!.name,
      details: `Verified by volunteer (reputation: ${req.user!.reputationScore})`,
    });

    await User.findByIdAndUpdate(req.user!._id, { $inc: { reputationScore: 3 } });

    res.json(issue);
  } catch (err) {
    next(err);
  }
};

export const getMyIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issues = await Issue.find({ reportedBy: req.user!._id }).sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    next(err);
  }
};

export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [total, resolved, inProgress, reported] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: "resolved" }),
      Issue.countDocuments({ status: "in-progress" }),
      Issue.countDocuments({ status: "reported" }),
    ]);

    const byCategory = await Issue.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const byStatus = await Issue.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const recentIssues = await Issue.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title category status createdAt");

    const totalEstimatedCost = await Issue.aggregate([
      { $group: { _id: null, total: { $sum: "$estimatedCost" } } },
    ]);

    const totalActualCost = await Issue.aggregate([
      { $group: { _id: null, total: { $sum: "$actualCost" } } },
    ]);

    const costByCategory = await Issue.aggregate([
      {
        $group: {
          _id: "$category",
          estimated: { $sum: "$estimatedCost" },
          actual: { $sum: "$actualCost" },
          count: { $sum: 1 },
        },
      },
    ]);

    const escalated = await Issue.countDocuments({ escalationLevel: { $ne: "normal" } });

    res.json({
      total,
      resolved,
      inProgress,
      reported,
      byCategory,
      byStatus,
      recentIssues,
      totalEstimatedCost: totalEstimatedCost[0]?.total || 0,
      totalActualCost: totalActualCost[0]?.total || 0,
      costByCategory,
      escalated,
    });
  } catch (err) {
    next(err);
  }
};

export const getNearbyIssues = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lat, lng, radius, category } = req.query;
    if (!lat || !lng) {
      res.status(400).json({ message: "lat & lng required" });
      return;
    }

    const query: Record<string, any> = {
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng as string), parseFloat(lat as string)] },
          $maxDistance: parseInt(radius as string) || 2000,
        },
      },
    };

    if (category) query.category = category;
    const issues = await Issue.find(query);
    res.json(issues);
  } catch (err) {
    next(err);
  }
};

export const findDuplicates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lat, lng, category, radius } = req.query;
    if (!lat || !lng || !category) {
      res.status(400).json({ message: "lat, lng, and category required" });
      return;
    }

    const issues = await Issue.find({
      category: category as string,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng as string), parseFloat(lat as string)] },
          $maxDistance: parseInt(radius as string) || 20,
        },
      },
    }).limit(5);

    res.json(issues);
  } catch (err) {
    next(err);
  }
};

export const suggestCategoryFromText = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { text, filename } = req.body;
    const category = suggestCategory(text, filename);
    const severity = estimateSeverity(text);
    res.json({ suggestedCategory: category, estimatedSeverity: severity });
  } catch (err) {
    next(err);
  }
};

export const getAuditTrail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const entries = await AuditLog.find({ issueId: req.params.id }).sort({ createdAt: 1 });
    res.json(entries);
  } catch (err) {
    next(err);
  }
};

export const verifyAuditTrailEndpoint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await verifyAuditChain(req.params.id as string);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getDigitalTwinData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const issues = await Issue.find({ status: { $ne: "resolved" } });

    const GRID_SIZE = 0.005;
    const grid: Record<string, { lat: number; lng: number; count: number; categories: Record<string, number>; issues: any[] }> = {};

    issues.forEach((issue) => {
      const lat = Math.round(issue.location.coordinates[1] / GRID_SIZE) * GRID_SIZE;
      const lng = Math.round(issue.location.coordinates[0] / GRID_SIZE) * GRID_SIZE;
      const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;

      if (!grid[key]) {
        grid[key] = { lat, lng, count: 0, categories: {}, issues: [] };
      }
      grid[key].count++;
      grid[key].categories[issue.category] = (grid[key].categories[issue.category] || 0) + 1;
      grid[key].issues.push({
        _id: issue._id,
        title: issue.title,
        category: issue.category,
        priority: issue.priority,
      });
    });

    res.json(Object.values(grid));
  } catch (err) {
    next(err);
  }
};
