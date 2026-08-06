import express from "express";
import {
  register,
  login,
  getMe,
  logout,
  verifyEmail,
} from "../controller/authController.js";
import { identifyUser, isVerified } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/verify-email", verifyEmail);

// Protected routes (requires valid JWT + verified email)
router.get("/getme", identifyUser, isVerified, getMe);
router.post("/logout", identifyUser, logout);

export default router;
