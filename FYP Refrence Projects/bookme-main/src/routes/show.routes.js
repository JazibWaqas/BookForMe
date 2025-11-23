import { Router } from "express";
import showController from "../controllers/show.controller";

const showRoutes = Router();
showRoutes.post("/shows", showController.add);
showRoutes.get("/shows", showController.get);

export { showRoutes };
