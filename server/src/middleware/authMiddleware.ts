import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

const JWT_SECRET: string = process.env.JWT_SECRET || "citycare_secret_key_2026";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "30d" });
};

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await User.findById(decoded.id).select("-password");
      if (user) {
        req.user = user;
        next();
        return;
      }
    } catch {
      res.status(401).json({ message: "Not authorized, token failed" });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  if (req.headers.authorization?.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await User.findById(decoded.id).select("-password");
      if (user) req.user = user;
    } catch {
      // Token invalid, proceed as guest
    }
  }
  next();
};

export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === "admin" || req.user.role === "super-admin")) {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};
