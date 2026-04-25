import { Request, Response, NextFunction } from "express";
import Project from "../models/Project";
import User from "../models/User";

export const createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, description, ward, estimatedBudget } = req.body;
    const project = await Project.create({
      title,
      description,
      ward,
      estimatedBudget,
      createdBy: req.user!._id,
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

export const getProjects = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projects = await Project.find()
      .sort({ totalVotePoints: -1, createdAt: -1 })
      .populate("createdBy", "name");
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

export const voteOnProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const alreadyVoted = project.votes.find(
      (v) => v.user.toString() === req.user!._id.toString()
    );
    if (alreadyVoted) {
      res.status(400).json({ message: "You already voted on this project" });
      return;
    }

    const pointsToSpend: number = req.body.points || 1;

    if (req.user!.reputationScore < pointsToSpend) {
      res.status(400).json({
        message: `Not enough reputation points. You have ${req.user!.reputationScore}`,
      });
      return;
    }

    project.votes.push({ user: req.user!._id, points: pointsToSpend });
    project.totalVotePoints += pointsToSpend;
    await project.save();

    await User.findByIdAndUpdate(req.user!._id, {
      $inc: { reputationScore: -pointsToSpend },
    });

    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    res.json({ message: "Project deleted" });
  } catch (err) {
    next(err);
  }
};
