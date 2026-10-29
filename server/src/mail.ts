import nodemailer, { Transporter } from 'nodemailer';
import { config } from './config';

let transporter: Transporter | null = null;
let initialised = false;

function getTransporter(): Transporter | null {
  if (initialised) return transporter;
  initialised = true;

  if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    requireTLS: config.SMTP_PORT === 587,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });

  return transporter;
}

export interface MailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(input: MailInput): Promise<void> {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[mail:dev] to=${input.to} subject=${input.subject}\n${input.text}`);
    return;
  }

  await mailer.sendMail({
    from: config.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

export function mailConfigured(): boolean {
  return Boolean(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
}
