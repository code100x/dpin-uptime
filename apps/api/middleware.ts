import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_PUBLIC_KEY } from "./config";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_PUBLIC_KEY);
    if (!decoded || !decoded.sub) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    req.userId = decoded.sub as string;

    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
}
