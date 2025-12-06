"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const accountController_1 = require("../controllers/accountController");
const router = (0, express_1.Router)();
router.post("/", authMiddleware_1.authMiddleware, accountController_1.createAccount);
router.get("/", authMiddleware_1.authMiddleware, accountController_1.listAccounts);
exports.default = router;
