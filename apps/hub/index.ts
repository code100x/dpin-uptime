import { randomUUIDv7, type ServerWebSocket } from "bun";
import type { IncomingMessage, SignupIncomingMessage } from "common/types";
import { prismaClient } from "db/client";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import nacl_util from "tweetnacl-util";
import { redis } from "cache/redis";

const CALLBACKS: { [callbackId: string]: (data: IncomingMessage) => void } = {};
const COST_PER_VALIDATION = 100; // in lamports

const server = Bun.serve({
    fetch(req, server) {
        if (server.upgrade(req)) {
            return;
        }
        return new Response("Upgrade failed", { status: 500 });
    },
    port: 8081,
    websocket: {
        async message(ws: ServerWebSocket<unknown>, message: string) {
            const data: IncomingMessage = JSON.parse(message);

            if (data.type === "signup") {
                const verified = await verifyMessage(
                    `Signed message for ${data.data.callbackId}, ${data.data.publicKey}`,
                    data.data.publicKey,
                    data.data.signedMessage
                );
                if (verified) {
                    await signupHandler(ws, data.data);
                }
            } else if (data.type === "validate" && CALLBACKS[data.data.callbackId]) {
                CALLBACKS[data.data.callbackId](data);
                delete CALLBACKS[data.data.callbackId];
            }
        },
        async close(ws: ServerWebSocket<unknown>) {
            const validatorId = await redis.hget("wsToValidator", ws.toString());
    if (!validatorId) {
        console.log("Disconnected WebSocket not found in Redis.");
        return;
    }

    console.log(`Removing validator ${validatorId} from active list`);

    await redis.srem("availableValidators", validatorId);
    await redis.lrem("validatorQueue", 0, validatorId);
    await redis.hdel("wsToValidator", ws.toString());
    await redis.hdel("validatorWs", validatorId);

    const channelName = `validator:${validatorId}`;
    ws.unsubscribe(channelName);

    console.log(`Validator ${validatorId} successfully removed.`);

        },
    },
});

async function getIpLocation(ip: string) {
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await res.json();
        return JSON.stringify({
            country: data.country,
            city: data.city,
            region: data.regionName,
            lat: data.lat,
            lon: data.lon,
        });
    } catch (error) {
        console.error("Error fetching IP location:", error);
        return "unknown";
    }
}


async function signupHandler(ws: ServerWebSocket<unknown>, { publicKey, callbackId }: SignupIncomingMessage) {
    let validator = await prismaClient.validator.findFirst({
        where: { publicKey },
    });

    if (!validator) {
        const ip = ws?.remoteAddress || "unknown";
        const location = await getIpLocation(ip)
        validator = await prismaClient.validator.create({
            data: { ip, publicKey, location },
        });
    }

    ws.send(JSON.stringify({
        type: "signup",
        data: { validatorId: validator.id, callbackId },
    }));

    await redis.sadd("availableValidators", validator.id);
    await redis.lpush("validatorQueue", validator.id);
    await redis.hset("wsToValidator", ws.toString(), validator.id);
    const channelName = `validator:${validator.id}`;
    ws.subscribe(channelName);
    await redis.hset("validatorWs", validator.id, ws.toString());
}

async function verifyMessage(message: string, publicKey: string, signature: string) {
    const messageBytes = nacl_util.decodeUTF8(message);
    const signatureBytes = new Uint8Array(JSON.parse(signature));
    return nacl.sign.detached.verify(messageBytes, signatureBytes, new PublicKey(publicKey).toBuffer());
}

setInterval(async () => {
    const websitesToMonitor = await prismaClient.website.findMany({
        where: { disabled: false },
    });

    const validationQueue = websitesToMonitor.map(website => ({
        websiteId: website.id,
        url: website.url,
    }));

    while (validationQueue.length > 0) {
        const validationRequest = validationQueue.shift();
        if (!validationRequest) continue;

        const validatorId = await redis.rpoplpush("validatorQueue", "validatorQueue");
        if (!validatorId) continue;

        const validatorWsString = await redis.hget("validatorWs", validatorId);
        if (!validatorWsString) continue;

        const validator = await prismaClient.validator.findUnique({ where: { id: validatorId } });
        if (!validator) continue;

        const callbackId = randomUUIDv7();
        console.log(`Sending validation request to ${validatorId}: ${validationRequest.url}`);

        server.publish(`validator:${validatorId}`, JSON.stringify({
            type: "validate",
            data: { url: validationRequest.url, callbackId },
        }));

        CALLBACKS[callbackId] = async (data: IncomingMessage) => {
            if (data.type === "validate") {
                const { status, latency, signedMessage } = data.data;
                const verified = await verifyMessage(`Replying to ${callbackId}`, validator.publicKey, signedMessage);
                if (!verified) return;

                await prismaClient.$transaction(async tx => {
                    await tx.websiteTick.create({
                        data: { websiteId: validationRequest.websiteId, validatorId, status, latency, createdAt: new Date() },
                    });

                    await tx.validator.update({
                        where: { id: validatorId },
                        data: { pendingPayouts: { increment: COST_PER_VALIDATION } },
                    });
                });
            }
        };
    }
}, 60 * 1000);
