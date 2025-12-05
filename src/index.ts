import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "./prismaClient";
import authRoutes from "./routes/auth";
import { authMiddleware } from "./middlewares/authMiddleware";
import accountRoutes from "./routes/account";
import binanceRoutes from "./routes/binance";



const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use("/api/accounts", accountRoutes);
app.use("/api/binance", binanceRoutes);

// rota protegida teste
app.get("/api/me", authMiddleware, (req: any, res) => {
  res.json({ user: req.user });
});

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API funcionando!" });
});

// Rota de teste do banco (ADICIONA ESSA)
app.get("/api/health", async (req, res) => {
  try {
    const usersCount = await prisma.user.count();
    res.json({ db: "ok", usersCount });
  } catch (err) {
    console.error("DB health error:", err);
    res.status(500).json({ db: "error", message: String(err) });
  }
});

app.use("/api/auth", authRoutes);


app.listen(4000, () => {
  console.log("Servidor rodando em http://localhost:4000");
});
