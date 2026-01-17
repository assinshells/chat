// backend/src/services/email.service.js

import nodemailer from "nodemailer";
import { logger } from "../lib/logger.js";
import { getEnvConfig } from "../config/env.config.js";

const envConfig = getEnvConfig();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    if (envConfig.NODE_ENV === "production") {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      nodemailer.createTestAccount().then((account) => {
        this.transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        });

        logger.info(
          {
            user: account.user,
            pass: account.pass,
          },
          "Ethereal email account created for testing",
        );
      });
    }
  }

  async sendPasswordReset(email, resetToken) {
    const resetUrl = `${envConfig.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Chat App" <noreply@chatapp.com>',
      to: email,
      subject: "Password Reset Request",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0d6efd; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background: #0d6efd; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
            }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>You recently requested to reset your password. Click the button below to reset it:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #0d6efd;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request

        You recently requested to reset your password.
        
        Click this link to reset it:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email.
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      if (envConfig.NODE_ENV === "development") {
        logger.info(
          {
            messageId: info.messageId,
            previewUrl: nodemailer.getTestMessageUrl(info),
          },
          "Password reset email sent (dev mode)",
        );
        console.log(
          "\n📧 Preview email: %s\n",
          nodemailer.getTestMessageUrl(info),
        );
      } else {
        logger.info(
          { email, messageId: info.messageId },
          "Password reset email sent",
        );
      }

      return info;
    } catch (error) {
      logger.error({ error, email }, "Failed to send password reset email");
      throw error;
    }
  }

  async sendWelcome(email, nickname) {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Chat App" <noreply@chatapp.com>',
      to: email,
      subject: "Welcome to Chat App!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #198754; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Chat App!</h1>
            </div>
            <div class="content">
              <p>Hi ${nickname},</p>
              <p>Thanks for joining our chat community! We're excited to have you.</p>
              <p>You can now start chatting with other users and enjoy all the features.</p>
              <p>If you have any questions, feel free to reach out.</p>
            </div>
            <div class="footer">
              <p>Happy chatting!</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Chat App!
        
        Hi ${nickname},
        
        Thanks for joining our chat community! We're excited to have you.
        
        You can now start chatting with other users and enjoy all the features.
        
        If you have any questions, feel free to reach out.
        
        Happy chatting!
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      if (envConfig.NODE_ENV === "development") {
        logger.info(
          { previewUrl: nodemailer.getTestMessageUrl(info) },
          "Welcome email sent (dev mode)",
        );
      } else {
        logger.info({ email, messageId: info.messageId }, "Welcome email sent");
      }

      return info;
    } catch (error) {
      logger.error({ error, email }, "Failed to send welcome email");
    }
  }
}

export const emailService = new EmailService();
