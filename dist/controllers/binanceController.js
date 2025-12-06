"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAccountConnection = testAccountConnection;
const prismaClient_1 = require("../prismaClient");
const binanceService_1 = require("../services/binanceService");
async function testAccountConnection(req, res) {
    try {
        const userId = req.user.userId;
        const accountId = req.params.accountId;
        // busca a conta, garantindo que pertence ao usuário
        const account = await prismaClient_1.prisma.account.findUnique({ where: { id: accountId } });
        if (!account)
            return res.status(404).json({ error: "account not found" });
        if (account.ownerId !== userId)
            return res.status(403).json({ error: "forbidden" });
        const result = await (0, binanceService_1.testFuturesConnection)(account.apiKeyEnc, account.apiSecretEnc);
        if (!result.ok)
            return res.status(500).json({ ok: false, error: result.error });
        return res.json({ ok: true, data: result.data });
    }
    catch (err) {
        console.error("testAccountConnection error:", err);
        return res.status(500).json({ error: "internal" });
    }
}
