import { client } from "db/client";
import type { Request, Response } from "express";
import { WebsiteDataValidation } from "../validations/website";

export const CreateWebsite = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const data = WebsiteDataValidation.parse(req.body);

    const { url } = data;

    const checkIfWebsiteExists = await client.website.findFirst({
      where: {
        url,
      },
    });

    if (checkIfWebsiteExists) {
      res.status(409).json({
        success: false,
        message: "Website already exists in our database",
      });
      return;
    }

    const website = await client.website.create({
      data: {
        url,
        userId,
      },
    });

    res.status(201).json({
      success: true,
      data: website.id,
      message: "Website created successfully",
    });
  } catch (error) {
    console.error("Failed to create website", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const GetAllWebsites = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const websites = await client.website.findMany({
      where: {
        userId,
        disabled: false,
      },
      include: {
        ticks: true,
      },
    });

    res
      .status(200)
      .json({ success: true, data: websites, message: "Get all websites" });
  } catch (error) {
    console.error("Failed to get websites", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const GetWebsiteStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const websiteId = req.query.websiteId! as unknown as string;

    const website = await client.website.findFirst({
      where: {
        id: websiteId,
        userId,
        disabled: false,
      },
      include: {
        ticks: true,
      },
    });

    res.status(200).json({
      success: true,
      data: website,
      message: "Website status retrieved successfully",
    });
  } catch (error) {
    console.error("Failed to delete Website", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const DeleteWebsite = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const websiteId = req.body.websiteId; // not nesecarry to validate

    await client.website.delete({
      where: {
        id: websiteId,
        userId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Website deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete Website", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const Payout = async (req: Request, res: Response) => {
  try {
  } catch (error) {}
};
