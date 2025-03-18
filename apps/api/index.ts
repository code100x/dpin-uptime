import express from "express"
import { authMiddleware } from "./middleware";
import { prismaClient } from "db/client";
import cors from "cors";
import { Transaction, SystemProgram, Connection } from "@solana/web3.js";


const connection = new Connection("https://api.mainnet-beta.solana.com");
const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/v1/website", authMiddleware, async (req, res) => {
    const userId = req.userId!;
    const { url, email } = req.body;

    const data = await prismaClient.website.create({
        data: {
            userId,
            url, 
            email
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
   
})

app.listen(8080);
