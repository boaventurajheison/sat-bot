"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/binance.ts
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const binanceController_1 = require("../controllers/binanceController");
const router = (0, express_1.Router)();
// Testar conexão de uma conta (accountId é o id do registro Account)
router.get("/test/:accountId", authMiddleware_1.authMiddleware, binanceController_1.testAccountConnection);
exports.default = router;
