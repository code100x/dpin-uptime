import express from "express"
import { authMiddleware } from "./middleware";
import { prismaClient } from "db/client";
import cors from "cors";
import { SystemProgram, Connection, PublicKey, VersionedTransaction, TransactionMessage, Keypair, clusterApiUrl } from "@solana/web3.js";
import { redis } from "cache/client";

const connection = new Connection(clusterApiUrl("devnet"));
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

    const validatorId = req.params.validatorId;

    const validator = await prismaClient.validator.findFirst({
        where:{
            id: validatorId,
        }
    });

    if(!validator){
        res.json({
            message: "Validator not found"
        })
        return;
    }

    if(validator.payoutLocked){
        res.json({
            message: "Payout is locked, Please wait for some time before attempting to payout again"
        })
        return;
    }

    await redis.lpush("payouts", validatorId);

    res.json({
        message: "Payout queued successfully"
    })

    return;

})


app.listen(8080);


async function main(){
    // Avoid Rate Limiting
    setInterval(async ()=>{
        await sendPayouts();
        await verifyTxs();
    },3000)
}

main();

async function sendPayouts(){

    const validatorId = await redis.rpop("payouts");

    try {

        if(validatorId){

            const validator = await prismaClient.validator.findFirst({
                where:{
                    id: validatorId,
                }
            });

            if(validator && !validator.payoutLocked){
            
                await prismaClient.validator.update({
                    where: {
                        id: validatorId
                    },
                    data: {
                        payoutLocked: true
                    }
                });

                // create tx and push it to txVerification queue

                const keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY!)));

                const lamports = validator.pendingPayouts;

                const transferIx = SystemProgram.transfer({
                    fromPubkey: keypair.publicKey,
                    toPubkey: new PublicKey(validator.publicKey),
                    lamports,
                });

                const {blockhash} = await connection.getLatestBlockhash();

                const messageV0 = new TransactionMessage({
                    payerKey:keypair.publicKey,
                    recentBlockhash: blockhash,
                    instructions : [transferIx],
                }).compileToV0Message();

                const versionedTx = new VersionedTransaction(messageV0);
                versionedTx.sign([keypair]);

                console.log(`Sending Payout to validator ${validator.publicKey} with ID ${validatorId} of Amount: ${validator.pendingPayouts}`);

                const tx = await connection.sendTransaction(versionedTx);
                const payload = {validatorId, tx, payoutAmount: validator.pendingPayouts}
                await redis.lpush("txVerification", JSON.stringify(payload));
            }
        }
        
    } catch (error) {
        console.log("Error while sending payouts");
        console.error(error);
    }
    

}

async function verifyTxs(){
    const payload = await redis.rpop("txVerification");

    if(payload){
        const {validatorId, tx, payoutAmount} : {validatorId: string, tx: string, payoutAmount: number} = JSON.parse(payload);
        
        // verify the tx
        const result = await connection.getParsedTransaction(tx, {maxSupportedTransactionVersion:0, commitment:"confirmed"});

        console.log("Transaction Result for ", tx);
        console.dir(result, {depth:null});

        // The tx may not be updated immmediately
        if(!result){
            await redis.lpush("txVerification", JSON.stringify({validatorId, tx, payoutAmount}));
            return;
        }

        const preBalances = result?.meta?.preBalances;
        const postBalances = result?.meta?.postBalances;

        // verify this based on the tx
        let isPaidSuccessfully = false;

        const fee = result.meta?.fee;

        if(preBalances && postBalances && fee && postBalances[1] - preBalances[1] === payoutAmount && preBalances[0] - postBalances[0] === (fee + payoutAmount)){
            isPaidSuccessfully = true;
            console.log("Transaction verified successfully for ", tx);
        }

        if(!isPaidSuccessfully){
            return;
        }
        else{

            await prismaClient.$transaction(async tx =>{

                const validator = await tx.validator.findUnique({
                    where:{
                        id:validatorId,
                    }
                });

                // This will not happen , just to satisfy TS
                if(!validator){
                    console.log("Validator ID not found in DB", validator) 
                    return;
                }

                // When We set to 0, The amount after locked will be lost, so to handle that
                const balanceToSet = validator.pendingPayouts - payoutAmount ;

                await tx.validator.update({
                    where: {
                        id: validatorId
                    },
                    data: {
                        payoutLocked: false,
                        pendingPayouts: balanceToSet,
                    }
                });

            })
        }

    }


}