import express from "express";
import { authMiddleware } from "./middleware";
import { prismaClient } from "db/client";
import cors from "cors";
import { metricsMiddleware } from "metrics/metrics";
import { Transaction, SystemProgram, Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const app = express();

app.use(cors());
app.use(metricsMiddleware);
app.use(express.json());

app.post("/api/v1/website", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { url } = req.body;

    const data = await prismaClient.website.create({
      data: {
        userId,
        url,
      },
    });

    res.json({
      id: data.id,
    });
  } catch (error) {
    console.error("Error creating website:", error);
    res.status(500).json({ error: "Failed to create website" });
  }
});

app.get("/api/v1/website/status", authMiddleware, async (req, res) => {
  try {
    const websiteId = req.query.websiteId! as unknown as string;
    const userId = req.userId;

    const data = await prismaClient.website.findFirst({
      where: {
        id: websiteId,
        userId,
        disabled: false,
      },
      include: {
        ticks: true,
      },
    });

    res.json(data);
  } catch (error) {
    console.error("Error fetching website status:", error);
    res.status(500).json({ error: "Failed to fetch website status" });
  }
});

app.get("/api/v1/websites", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    console.log("userId :", userId);

    const websites = await prismaClient.website.findMany({
      where: {
        userId,
        disabled: false,
      },
      include: {
        ticks: true,
      },
    });

    res.json({
      websites,
    });
  } catch (error) {
    console.error("Error fetching websites:", error);
    res.status(500).json({ error: "Failed to fetch websites" });
  }
});

app.delete("/api/v1/website/", authMiddleware, async (req, res) => {
  try {
    const websiteId = req.body.websiteId;
    const userId = req.userId!;

    await prismaClient.website.update({
      where: {
        id: websiteId,
        userId,
      },
      data: {
        disabled: true,
      },
    });

    res.json({
      message: "Deleted website successfully",
    });
  } catch (error) {
    console.error("Error deleting website:", error);
    res.status(500).json({ error: "Failed to delete website" });
  }
});

//getting total amount need to pay at this moment
app.get("/api/v1/payout", authMiddleware,  async (req, res) => {
  try {
    const totalPending = await prismaClient.validator.aggregate({
      _sum: {
        pendingPayouts: true
      }
    });

    res.json({
      totalPendingAmount: totalPending._sum.pendingPayouts || 0
    });
  } catch (error) {
    console.error("Error fetching total pending payouts:", error);
    res.status(500).json({ error: "Failed to fetch total pending payouts" });
  }
});

//getting how much needed to pay to any validator 
app.get("/api/v1/payout/:validatorId", authMiddleware,  async(req, res) => {
  try {
    const validatorId = req.params.validatorId;
    
    const validator = await prismaClient.validator.findUnique({
      where: { id: validatorId },
      select: {
        id: true,
        publicKey: true,
        pendingPayouts: true
      }
    });

    if (!validator) {
      res.status(404).json({ error: "Validator not found" });
      return;
    }

    res.json({
      validatorId: validator.id,
      publicKey: validator.publicKey,
      pendingAmount: validator.pendingPayouts
    });
  } catch (error) {
    console.error("Error fetching validator payout:", error);
    res.status(500).json({ error: "Failed to fetch validator payout details" });
  }
});

//paying to any validator 
app.post("/api/v1/payout/:validatorId", async (req, res) => {
  try {
    const {amount} = req.body;
    const validatorId = req.params.validatorId;
    
    if (!amount || amount <= 0) {
      res.status(400).json({ error: "Invalid amount"})
      return
    }

    // database transaction
    const result = await prismaClient.$transaction(async (tx) => {
      const validator = await tx.validator.findUnique({
        where: { id: validatorId }
      });

      if (!validator) {
        throw new Error("Validator not found");
      }

      if (amount > validator.pendingPayouts) {
        throw new Error("Payout amount exceeds pending balance");
      }

      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(process.env.TREASURY_WALLET!),
          toPubkey: new PublicKey(validator.publicKey!),
          lamports: amount
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // Update pending payouts within the transaction
      await tx.validator.update({
        where: { id: validatorId },
        data: {
          pendingPayouts: validator.pendingPayouts - amount
        }
      });

      return {
        transaction: transaction.serialize({requireAllSignatures: false}),
        remainingPendingAmount: validator.pendingPayouts - amount
      };
    });

    res.json({
      message: "Transaction created successfully",
      ...result
    });

  } catch (error) {
    console.log("payout error: ", error);
    if (error instanceof Error) {
      if (error.message === "Validator not found") {
        res.status(404).json({ error: "Validator not found" });
      } else if (error.message === "Payout amount exceeds pending balance") {
        res.status(400).json({ error: "Payout amount exceeds pending balance" });
      } else {
        res.status(500).json({ error: "Failed to create payout" });
      }
    } else {
      res.status(500).json({ error: "Failed to create payout" });
    }
  }
});

app.listen(8080);
