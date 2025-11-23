import { Router } from "express";
import bookingController from "../controllers/booking.controller";
import authMiddleware from "../middlewares/auth.middleware";

const bookingRoutes = Router();
bookingRoutes.get("/availability/:showId", bookingController.checkAvailability);
bookingRoutes.post("/lock-seats", authMiddleware, bookingController.lockSeats);
bookingRoutes.post("/book", authMiddleware, bookingController.bookTicket);

export { bookingRoutes };
