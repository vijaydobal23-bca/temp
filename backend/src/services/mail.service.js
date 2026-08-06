import nodemailer from "nodemailer";
import dns from "dns";

// Force IPv4 resolution — prevents IPv6-related SMTP failures on Render
dns.setDefaultResultOrder("ipv4first");
console.log("Email function one" + process.env.GOOGLE_USER);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GOOGLE_USER,
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    accessToken: process.env.GOOGLE_ACCESS_TOKEN
    // Do NOT pass accessToken here — nodemailer will fetch a fresh one
    // using the refreshToken, so it never expires.
  },
});

transporter
  .verify()
  .then(() => console.log("[Mail] Transporter ready ✔"))
  .catch((err) =>
    console.error("[Mail] Transporter verification failed:", err.message),
  );

export async function sendEmail({ to, subject, html, text }) {
  console.log("Email function");
  const mailOptions = {
    from: `"Altco" <${process.env.GOOGLE_USER}>`,
    to,
    subject,
    html,
    text,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("[Mail] Email sent:", info.messageId);
  return info;
}
