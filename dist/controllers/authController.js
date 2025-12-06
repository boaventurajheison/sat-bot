"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = require("../prismaClient");
const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const JWT_EXPIRES = "8h";
async function register(req, res) {
    try {
        const { name, email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: "email & password required" });
        const existing = await prismaClient_1.prisma.user.findUnique({ where: { email } });
        if (existing)
            return res.status(409).json({ error: "user already exists" });
        const hashed = await bcryptjs_1.default.hash(password, 10);
        const user = await prismaClient_1.prisma.user.create({
            data: { name, email, password: hashed, role: "viewer" }
        });
        // não retornar senha
        return res.status(201).json({ id: user.id, email: user.email, name: user.name });
    }
    catch (err) {
        console.error("register error:", err);
        return res.status(500).json({ error: "internal" });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: "email & password required" });
        const user = await prismaClient_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(401).json({ error: "invalid credentials" });
        const ok = await bcryptjs_1.default.compare(password, user.password);
        if (!ok)
            return res.status(401).json({ error: "invalid credentials" });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
        return res.json({ token });
    }
    catch (err) {
        console.error("login error:", err);
        return res.status(500).json({ error: "internal" });
    }
}
