// src/routes/binance.ts
import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { testAccountConnection } from "../controllers/binanceController";

const router = Router();

// Testar conexão de uma conta (accountId é o id do registro Account)
router.get("/test/:accountId", authMiddleware, testAccountConnection);

export default router;
