import nodemailer from "nodemailer";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

export async function sendEmail({ to, subject, html, text }) {
  console.log("Email function called for:", to);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    family: 4,
    auth: {
      type: "OAuth2",
      user: process.env.GOOGLE_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
    logger: true,
    debug: true,
  });

  try {
    console.log("Checking transporter...");

    await transporter.verify();

    console.log("✅ Transporter is ready");

    const mailOptions = {
      from: `"Altco" <${process.env.GOOGLE_USER}>`,
      to,
      subject,
      html,
      text,
    };

    console.log("Sending email...");

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.messageId);

    return info;

  } catch (err) {
    console.log("❌ Email Error:");
    console.log(err);
    throw err;
  }
}