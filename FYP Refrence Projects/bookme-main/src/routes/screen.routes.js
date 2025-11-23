import { Router } from "express";
import screenController from "../controllers/screen.controller";
import authMiddleware from "../middlewares/auth.middleware";

const screenRoutes = Router();

// Public
screenRoutes.get("/screens", screenController.get);
screenRoutes.get("/screens/:id", screenController.find);

// Admin only
screenRoutes.post("/screens", authMiddleware, screenController.add);
screenRoutes.put("/screens/:id", authMiddleware, screenController.update);
screenRoutes.delete("/screens/:id", authMiddleware, screenController.delete);

export { screenRoutes };
