import express from "express";
import { authMiddleware } from "./middleware";
import { prismaClient } from "db/client";
import cors from "cors";
import {
  Transaction,
  SystemProgram,
  Connection,
  PublicKey,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const publicKey = new PublicKey(process.env.PUBLIC_KEY!);
const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/v1/website", authMiddleware, async (req, res) => {
  const userId = req.userId!;
  const { url } = req.body;

  const data = await prismaClient.website.create({
    data: {
      userId,
            url
        }
    })

  res.json({
        id: data.id
    })
})

app.get("/api/v1/website/status", authMiddleware, async (req, res) => {
  const websiteId = req.query.websiteId! as unknown as string;
  const userId = req.userId;

  const data = await prismaClient.website.findFirst({
    where: {
      id: websiteId,
      userId,
            disabled: false
    },
    include: {
            ticks: true
        }
    })

    res.json(data)

})

app.get("/api/v1/websites", authMiddleware, async (req, res) => {
  const userId = req.userId!;

  const websites = await prismaClient.website.findMany({
    where: {
      userId,
            disabled: false
    },
    include: {
            ticks: true
        }
    })

  res.json({
        websites
    })
})

app.delete("/api/v1/website/", authMiddleware, async (req, res) => {
  const websiteId = req.body.websiteId;
  const userId = req.userId!;

  await prismaClient.website.update({
    where: {
      id: websiteId,
            userId
    },
    data: {
            disabled: true
        }
    })

  res.json({
        message: "Deleted website successfully"
    })
})

app.post("/api/v1/payout/:validatorId", async (req, res) => {
  const validatorId = req.params.validatorId! as unknown as string;
  console.log("Payout request received", validatorId);

  const validator = await prismaClient.validator.findFirst({
    where: {
      id: validatorId,
    },
  });

  if (!validator) {
    return res.status(400).json({
      message: "Validator not found",
    });
  }

  if (validator.isAmountClaimed) {
    return res.status(400).json({
      message: "Amount already claimed",
    });
  }

  // claim the amount
  await prismaClient.validator.update({
    where: {
      id: validatorId,
    },
    data: {
      isAmountClaimed: true,
    },
  });
  // transfer the SOL to the validator
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: publicKey,
      toPubkey: new PublicKey(validator.publicKey),
      lamports: validator.pendingPayouts,
    })
  );

  const signer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY!))
  );

  const signature = await sendAndConfirmTransaction(connection, transaction, [
    signer,
  ]);

  await prismaClient.solanaTransaction.create({
    data: {
      validatorId,
      amount: validator.pendingPayouts,
      createdAt: new Date(),
      signature,
    },
  });

  res.json({
    message: "Payout successful",
  });
});

app.listen(8080);
