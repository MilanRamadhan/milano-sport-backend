import express from "express";
import { getAllFinanceRecords, createFinanceRecord, updateFinanceRecord, deleteFinanceRecord } from "../controllers/financeController.js";
import { verifyToken, isAdmin } from "../middleware/auth.js";

const financeRouter = express.Router();

// Apply authentication and admin check to all routes
financeRouter.use(verifyToken);
financeRouter.use(isAdmin);

// Finance routes
financeRouter.get("/", getAllFinanceRecords);
financeRouter.post("/", createFinanceRecord);
financeRouter.patch("/:recordId", updateFinanceRecord);
financeRouter.delete("/:recordId", deleteFinanceRecord);

export default financeRouter;
