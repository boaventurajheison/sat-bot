// src/controllers/binanceController.ts
import { Request, Response } from "express";
import { prisma } from "../prismaClient";
import { testFuturesConnection } from "../services/binanceService";
import { AuthRequest } from "../middlewares/authMiddleware";

export async function testAccountConnection(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const accountId = req.params.accountId;

    // busca a conta, garantindo que pertence ao usuário
    const account = await prisma.account.findUnique({ where: { id: accountId }});
    if (!account) return res.status(404).json({ error: "account not found" });
    if (account.ownerId !== userId) return res.status(403).json({ error: "forbidden" });

    const result = await testFuturesConnection(account.apiKeyEnc, account.apiSecretEnc);
    if (!result.ok) return res.status(500).json({ ok: false, error: result.error });

    return res.json({ ok: true, data: result.data });
  } catch (err) {
    console.error("testAccountConnection error:", err);
    return res.status(500).json({ error: "internal" });
  }
}
