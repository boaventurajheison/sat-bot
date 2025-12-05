import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { createAccount, listAccounts } from "../controllers/accountController";

const router = Router();

router.post("/", authMiddleware, createAccount);
router.get("/", authMiddleware, listAccounts);

export default router;
