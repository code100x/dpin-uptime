import jwt from "jsonwebtoken";
import { JWT_PUBLIC_KEY } from "../config/config";
import type { NextFunction, Request, Response } from "express";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const token = req.headers["authorization"];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "You must be logged in",
        error: "Unauthorized",
      });
      return;
    }

    const decoded = jwt.verify(token, JWT_PUBLIC_KEY);

    if (!decoded || decoded.sub) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    req.userId = decoded.sub as string;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
      error: "Unauthorized",
    });
  }
}
