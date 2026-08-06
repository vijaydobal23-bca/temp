import nodemailer from "nodemailer";
import dns from "dns";

// Force IPv4 — prevents IPv6-related SMTP failures on Render
dns.setDefaultResultOrder("ipv4first");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,       // SSL — more reliable than 587 (STARTTLS) in production
  secure: true,
  auth: {
    user: process.env.GOOGLE_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

transporter
  .verify()
  .then(() => console.log("[Mail] Transporter ready ✔"))
  .catch((err) => console.error("[Mail] Transporter failed:", err.message));

export async function sendEmail({ to, subject, html, text }) {
  const info = await transporter.sendMail({
    from: `"Altco" <${process.env.GOOGLE_USER}>`,
    to,
    subject,
    html,
    text,
  });
  console.log("[Mail] Sent:", info.messageId);
  return info;
}