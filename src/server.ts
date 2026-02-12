import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import generateRouter from "./routes/generate";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Routes
app.use("/api/generate", generateRouter);

app.listen(PORT, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`   POST /api/generate — Agent Trinity pipeline`);
});
