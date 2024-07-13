import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import globalRouter from "./global-router";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use("/api", globalRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
