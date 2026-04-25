import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { generateToken } from "../middleware/authMiddleware";

export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      reputationScore: user.reputationScore,
      token: generateToken(user._id.toString()),
    });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        reputationScore: user.reputationScore,
        token: generateToken(user._id.toString()),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  res.json({
    _id: req.user!._id,
    name: req.user!.name,
    email: req.user!.email,
    role: req.user!.role,
    reputationScore: req.user!.reputationScore,
    watchRadius: req.user!.watchRadius,
    watchLocation: req.user!.watchLocation,
  });
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { watchRadius, watchLocation } = req.body;
    const updates: Record<string, any> = {};

    if (watchRadius !== undefined) updates.watchRadius = watchRadius;
    if (watchLocation) {
      updates.watchLocation = {
        type: "Point",
        coordinates: [watchLocation.lng, watchLocation.lat],
      };
    }

    const user = await User.findByIdAndUpdate(req.user!._id, updates, {
      new: true,
    }).select("-password");

    res.json(user);
  } catch (err) {
    next(err);
  }
};
