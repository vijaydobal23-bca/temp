import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries by default
    },

    role: {
      type: String,
      enum: ["buyer", "seller"],
      default: "buyer",
    },

    verified: {
      type: Boolean,
      default: false,
    },

    // Seller-specific fields (only populated when role === "seller")
    sellerInfo: {
      storeName: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// ─── Hash password before saving ─────────────────────────────────────────────
// Mongoose 7+: async middleware must NOT call next() — just return/throw
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

const User = mongoose.model("User", userSchema);

export default User;
