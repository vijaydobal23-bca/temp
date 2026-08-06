import jwt from "jsonwebtoken";
import User from "../model/userModel.js";

/**
 * Middleware: protect routes — verifies JWT from cookie or Authorization header.
 * Attaches the authenticated user to req.user.
 */
export const identifyUser = async (req, res, next) => {
  try {
    let token;

    // 1. Try reading from HTTP-only cookie
    if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }
    // 2. Fallback: Authorization: Bearer <token>
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please log in.",
      });
    }

    // Verify & decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB (exclude password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    req.user = user; // attach user to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};

/**
 * Middleware: ensure the authenticated user has verified their email.
 * Must be used AFTER identifyUser.
 */
export const isVerified = (req, res, next) => {
  if (!req.user.verified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email before accessing this resource.",
    });
  }
  next();
};

/**
 * Middleware: restrict access to seller role only.
 */
export const identifySeller = async (req, res, next) => {
  try {
    let token;

    // 1. Try reading from HTTP-only cookie
    if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }
    // 2. Fallback: Authorization: Bearer <token>
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please log in.",
      });
    }

    // Verify & decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB (exclude password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    if (user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to perform this action.",
      });
    }

    req.user = user; // attach user to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
};
