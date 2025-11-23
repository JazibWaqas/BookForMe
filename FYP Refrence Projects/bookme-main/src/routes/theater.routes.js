import { Router } from "express";
import theaterController from "../controllers/theater.controller";
import authMiddleware from "../middlewares/auth.middleware";

const theaterRoutes = Router();

theaterRoutes.get("/theaters", theaterController.get);
theaterRoutes.get("/theaters/:id", theaterController.find);

theaterRoutes.post("/theaters", authMiddleware, theaterController.add);
theaterRoutes.put("/theaters/:id", authMiddleware, theaterController.update);
theaterRoutes.delete("/theaters/:id", authMiddleware, theaterController.delete);

export { theaterRoutes };
