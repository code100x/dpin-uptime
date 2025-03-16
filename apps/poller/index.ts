import { prismaClient } from "db/client";
import { Connection } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

async function resolvePendingPayouts() {
  console.log("Resolving pending payouts");
  // get top 10 transactions
  const transactions = await prismaClient.solanaTransaction.findMany({
    orderBy: {
      createdAt: "asc",
    },
    take: 10,
  });

  const txStatuses = await connection.getSignatureStatuses(
    transactions.map((t) => t.signature)
  );

  for (let index = 0; index < txStatuses.value.length; index++) {
    const txStatus = txStatuses.value[index];

    if (txStatus?.confirmationStatus) {
      console.log(`Transaction Status:${txStatus.confirmationStatus}`);

      if (txStatus.confirmationStatus === "finalized") {
        await prismaClient.$transaction(async (tx) => {
          // delete Transaction
          await tx.solanaTransaction.delete({
            where: {
              id: transactions[index]!.id,
            },
          });
          // make `isAmountClaimed` = false and pendingPayouts = 0
          await tx.validator.update({
            where: {
              id: transactions[index]!.validatorId,
            },
            data: {
              isAmountClaimed: false,
              pendingPayouts: 0,
            },
          });
        });
        console.log(
          `Transactions of ${transactions[index]!.validatorId} resolved`
        );
      }
    }
  }
}

setInterval(resolvePendingPayouts, 1000 * 60);
