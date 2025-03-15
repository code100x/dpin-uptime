import express from "express";
import { authMiddleware } from "../middleware/middleware";
import {
  CreateWebsite,
  DeleteWebsite,
  GetAllWebsites,
  GetWebsiteStatus,
  Payout,
} from "../controllers/website";

export const websiteRouter = express.Router();

websiteRouter.get("/", authMiddleware, GetAllWebsites);
websiteRouter.post("/create", authMiddleware, CreateWebsite);
websiteRouter.get("/status", authMiddleware, GetWebsiteStatus);
websiteRouter.delete("/delete", authMiddleware, DeleteWebsite);
websiteRouter.post("/payout/:validatorId", authMiddleware, Payout);
