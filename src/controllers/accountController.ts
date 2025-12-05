import { Request, Response } from "express";
import { prisma } from "../prismaClient";
import { encrypt, decrypt } from "../utils/crypto";
import { AuthRequest } from "../middlewares/authMiddleware";

export async function createAccount(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { nickname, apiKey, apiSecret } = req.body;

    if (!apiKey || !apiSecret)
      return res.status(400).json({ error: "apiKey and apiSecret are required" });

    const account = await prisma.account.create({
      data: {
        ownerId: userId,
        nickname,
        apiKeyEnc: encrypt(apiKey),
        apiSecretEnc: encrypt(apiSecret),
      },
    });

    res.status(201).json({ id: account.id, nickname: account.nickname });
  } catch (err) {
    console.error("createAccount error:", err);
    return res.status(500).json({ error: "internal" });
  }
}

export async function listAccounts(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    const accounts = await prisma.account.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        nickname: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json(accounts);
  } catch (err) {
    console.error("listAccounts error:", err);
    return res.status(500).json({ error: "internal" });
  }
}
