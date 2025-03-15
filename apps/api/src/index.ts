import cors from "cors";
import morgan from "morgan";
import express from "express";
import { websiteRouter } from "./routes/website";
import { Transaction, SystemProgram, Connection } from "@solana/web3.js";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Routes
app.use("/api/v1/website", websiteRouter);

app.listen(8080, () => {
  console.log(`Api server is running at port 8080...`);
});
