import express from "express"
import { authMiddleware } from "./middleware";
import { prismaClient } from "db/client";
import {Prisma} from "db/client";
import cors from "cors";
import { Transaction, SystemProgram, Connection, Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
const privateKey=process.env.PRIVATE_KEY;

const connection = new Connection("https://api.mainnet-beta.solana.com");
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

    res.json({
        data
    });

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
    const validatorId=req.params.validatorId;

    const txn=await prismaClient.$transaction(async (prisma)=>{
        const validator=await prisma.validator.findUnique({
            where:{
                id: validatorId
            },
            select:{
                id: true,
                pendingPayouts: true,
                publicKey: true,
                lockedAt: true
            }
        })

        if (!validator){
            res.status(404).json({
                message: "Validator not found"
            });
            return;
        }

        if (validator.lockedAt){
            res.json({
                message: "Payout is still in process"
            });
            return;
        }

        if (validator.pendingPayouts===0){
            res.json({
                message: "No payout left"
            });
            return;
        }

        await prisma.validator.update({
            where:{
                id: validatorId
            },
            data:{
                lockedAt: new Date()
            }
        });
        return validator;
    });
    if (!txn) return;

    try{
        const fromKeypair=Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey!)));
        const toPublicKey= new PublicKey(txn.publicKey); 
        const amount=txn.pendingPayouts * 1000000;

        const transaction=new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: toPublicKey,
                lamports: amount
            })
        );

        const signature=await sendAndConfirmTransaction(connection, transaction, [fromKeypair]);
        await prismaClient.validator.update({
            where:{id: validatorId},
            data:{
                lockedAt: null,
                transactions:{
                    create:{
                        amount: amount,
                        signature: signature
                    } as Prisma.TransactionsCreateWithoutValidatorInput 
                }
            }
        });

        res.json({
            message: "Payout Successful with signature: ", signature
        })
    }catch(e){
        console.log("Error processing payout", e);
        res.status(500).json({
            messsage: "Error processing payout"
        });
    }

})

app.listen(8080);
