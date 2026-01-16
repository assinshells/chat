// backend/src/routes/health.routes.js

import { Router } from "express";
import mongoose from "mongoose";
import { validateQuery } from "../middleware/validation.middleware.js";
import Joi from "joi";

export const healthRouter = Router();

const healthQuerySchema = Joi.object({}).unknown(false);

healthRouter.get("/", validateQuery(healthQuerySchema), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get(
  "/ready",
  validateQuery(healthQuerySchema),
  async (req, res) => {
    try {
      const dbState = mongoose.connection.readyState;
      const isDbConnected = dbState === 1;

      if (!isDbConnected) {
        return res.status(503).json({
          success: false,
          message: "Service unavailable",
          checks: {
            database: "disconnected",
          },
        });
      }

      res.status(200).json({
        success: true,
        message: "Service is ready",
        checks: {
          database: "connected",
        },
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        message: "Service unavailable",
        error: error.message,
      });
    }
  }
);

healthRouter.get("/live", validateQuery(healthQuerySchema), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Service is alive",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get(
  "/info",
  validateQuery(healthQuerySchema),
  async (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    res.status(200).json({
      success: true,
      data: {
        server: {
          status: "running",
          uptime: process.uptime(),
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || "development",
        },
        database: {
          status: dbStates[dbState],
          host: mongoose.connection.host || "not connected",
          name: mongoose.connection.name || "not connected",
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: "MB",
        },
        timestamp: new Date().toISOString(),
      },
    });
  }
);
