import userModel from "../model/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "3d" },
  );

const setCookie = (res, token) =>
  res.cookie("jwt", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
  });

const safeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  verified: user.verified,
  sellerInfo: user.sellerInfo,
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
export async function register(req, res) {
  try {
    const { username, email, password, role, storeName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required.",
        success: false,
      });
    }

    if (role === "seller" && !storeName?.trim()) {
      return res.status(400).json({
        message: "Store name is required for seller accounts.",
        success: false,
      });
    }

    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (isUserAlreadyExists) {
      return res.status(400).json({
        message: "A user already exists with this email or username.",
        success: false,
      });
    }

    // Build user data — password is hashed by the pre-save hook in userModel
    const userData = { username, email, password, role: role || "buyer" };
    if (role === "seller") {
      userData.sellerInfo = { storeName: storeName.trim() };
    }

    const user = await userModel.create(userData);

    // Build the email-verification token
    const emailVerificationToken = jwt.sign(
      { email: user.email },
      process.env.JWT_SECRET,
    );

    const verifyUrl = `${process.env.BACKEND_URL || "http://localhost:3000"}/api/auth/verify-email?token=${emailVerificationToken}`;

    // Send verification email — non-blocking: SMTP failure won't block registration
    sendEmail({
      to: email,
      subject: "Verify your email – Altco",
      text: `Hi ${username}, please verify your email: ${verifyUrl}`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h1 style="color:#1e3a5f">Welcome to Altco, ${username}!</h1>
          <p>Thanks for registering. Please verify your email address by clicking the button below.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1e3a5f;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
            Verify Email
          </a>
          <p style="margin-top:24px;color:#888;font-size:13px">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    }).catch((err) => {
      console.error("[Email] Failed to send verification email:", err.message);
    });

    return res.status(201).json({
      message: "Registration successful! Please check your email to verify your account.",
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({
      message: "An error occurred during registration.",
      success: false,
      err: error.message,
    });
  }
}

// ─── GET /api/auth/verify-email ───────────────────────────────────────────────
export async function verifyEmail(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("<h2>Invalid verification link.</h2>");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).send("<h2>Verification link is invalid or has expired.</h2>");
    }

    const user = await userModel.findOne({ email: decoded.email });

    if (!user) {
      return res.status(400).send("<h2>User not found.</h2>");
    }

    if (user.verified) {
      return res.status(200).send(`
        <div style="font-family:sans-serif;text-align:center;padding:40px">
          <h1 style="color:#1e3a5f">Already Verified</h1>
          <p>Your email is already verified. You can log in.</p>
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login"
             style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1e3a5f;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
            Go to Login
          </a>
        </div>
      `);
    }

    // Use updateOne to avoid triggering the pre-save password-hash hook
    await userModel.updateOne({ _id: user._id }, { $set: { verified: true } });

    const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;

    return res.status(200).send(`
      <div style="font-family:sans-serif;text-align:center;padding:40px">
        <h1 style="color:#16a34a">&#10003; Email Verified Successfully!</h1>
        <p>Your account is now active. You can log in to Altco.</p>
        <a href="${loginUrl}"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1e3a5f;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
          Go to Login
        </a>
      </div>
    `);
  } catch (error) {
    console.error("Error during email verification:", error);
    return res.status(500).send("<h2>An error occurred during email verification.</h2>");
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in. Check your inbox.",
      });
    }

    const token = signToken(user);
    setCookie(res, token);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully.",
      user: safeUser(user),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

// ─── GET /api/auth/getme ──────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, user: safeUser(user) });
  } catch (error) {
    console.error("GetMe error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
export const logout = async (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully." });
};
