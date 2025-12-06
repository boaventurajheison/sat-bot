"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccount = createAccount;
exports.listAccounts = listAccounts;
const prismaClient_1 = require("../prismaClient");
const crypto_1 = require("../utils/crypto");
async function createAccount(req, res) {
    try {
        const userId = req.user.userId;
        const { nickname, apiKey, apiSecret } = req.body;
        if (!apiKey || !apiSecret)
            return res.status(400).json({ error: "apiKey and apiSecret are required" });
        const account = await prismaClient_1.prisma.account.create({
            data: {
                ownerId: userId,
                nickname,
                apiKeyEnc: (0, crypto_1.encrypt)(apiKey),
                apiSecretEnc: (0, crypto_1.encrypt)(apiSecret),
            },
        });
        res.status(201).json({ id: account.id, nickname: account.nickname });
    }
    catch (err) {
        console.error("createAccount error:", err);
        return res.status(500).json({ error: "internal" });
    }
}
async function listAccounts(req, res) {
    try {
        const userId = req.user.userId;
        const accounts = await prismaClient_1.prisma.account.findMany({
            where: { ownerId: userId },
            select: {
                id: true,
                nickname: true,
                isActive: true,
                createdAt: true,
            },
        });
        res.json(accounts);
    }
    catch (err) {
        console.error("listAccounts error:", err);
        return res.status(500).json({ error: "internal" });
    }
}
