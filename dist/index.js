"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const prismaClient_1 = require("./prismaClient");
const auth_1 = __importDefault(require("./routes/auth"));
const authMiddleware_1 = require("./middlewares/authMiddleware");
const account_1 = __importDefault(require("./routes/account"));
const binance_1 = __importDefault(require("./routes/binance"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use("/api/accounts", account_1.default);
app.use("/api/binance", binance_1.default);
// rota protegida teste
app.get("/api/me", authMiddleware_1.authMiddleware, (req, res) => {
    res.json({ user: req.user });
});
// Rota de teste
app.get("/", (req, res) => {
    res.json({ message: "API funcionando!" });
});
// Rota de teste do banco (ADICIONA ESSA)
app.get("/api/health", async (req, res) => {
    try {
        const usersCount = await prismaClient_1.prisma.user.count();
        res.json({ db: "ok", usersCount });
    }
    catch (err) {
        console.error("DB health error:", err);
        res.status(500).json({ db: "error", message: String(err) });
    }
});
app.use("/api/auth", auth_1.default);
app.listen(4000, () => {
    console.log("Servidor rodando em http://localhost:4000");
});
