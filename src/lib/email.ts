import nodemailer from "nodemailer";

const host = process.env.EMAIL_HOST;
const port = parseInt(process.env.EMAIL_PORT || "587", 10);
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const from = process.env.EMAIL_FROM || "Inkwell <no-reply@inkwell.blog>";

let transporter: nodemailer.Transporter | null = null;

if (host && user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  if (!transporter) {
    console.warn(
      `[Email Dev Mock] SMTP not configured. Simulating email to: ${options.to}`
    );
    console.log(`[Email Subject]: ${options.subject}`);
    console.log(`[Email Content]: ${options.text || options.html}`);
    return { response: "Mock email logged (configure SMTP in .env to send real emails)" };
  }

  const mailOptions = {
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error("Email send error:", error);
    throw new Error("Failed to send email. Please check your mail settings.");
  }
}
