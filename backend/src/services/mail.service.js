import nodemailer from "nodemailer";
import dns from "dns";

// Force IPv4 resolution — prevents IPv6-related SMTP failures on Render
dns.setDefaultResultOrder("ipv4first");

export async function sendEmail({ to, subject, html, text }) {
  console.log("Email function called for:", to);

  // Creating transporter inside the function ensures a fresh connection 
  // and avoids global connection pooling issues on Render.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    // Force IPv4 in the socket connection directly
    family: 4,
    auth: {
      type: "OAuth2",
      user: process.env.GOOGLE_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  });

  transporter.verify().then(() => {
    console.log("Transporter is ready");
  }).catch((err) => {
    console.log("Email transporter verification failed", err);
  });

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
