import express from "express";
import { authMiddleware } from "../middleware/middleware";
import {
  CreateWebsite,
  DeleteWebsite,
  GetAllWebsites,
  GetWebsiteStatus,
} from "../controllers/website";

export const websiteRouter = express.Router();

websiteRouter.get("/", authMiddleware, GetAllWebsites);
websiteRouter.post("/create", authMiddleware, CreateWebsite);
websiteRouter.post("/status", authMiddleware, GetWebsiteStatus);
websiteRouter.delete("/delete", authMiddleware, DeleteWebsite);
