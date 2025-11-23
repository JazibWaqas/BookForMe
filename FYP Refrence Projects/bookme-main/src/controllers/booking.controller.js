import * as Yup from "yup";
import { v4 as uuidv4 } from "uuid";
import Booking from "../models/Booking";
import Seat from "../models/Seat";
import Show from "../models/Show";
import redisService from "../services/redis.service";
import sequelizeService from "../services/sequelize.service";
import {
  BadRequestError,
  ValidationError,
  UnauthorizedError,
} from "../utils/ApiError";

const TTL = 600;

const bookingController = {
  checkAvailability: async (req, res, next) => {
    try {
      const { showId } = req.params;
      const show = await Show.findByPk(showId);
      if (!show) throw new BadRequestError("Show not found");

      const seats = await Seat.findAll({ where: { screenId: show.screenId } });
      const bookedSeats = await Booking.findAll({
        where: { showId, status: "booked" },
      });
      const bookedIds = bookedSeats.map((b) => b.seatId);

      const client = redisService.getClient();
      const lockedSeats = [];
      for (const seat of seats) {
        const lockKey = `lock:${showId}:${seat.id}`;
        if (await client.exists(lockKey)) lockedSeats.push(seat.id);
      }

      const available = seats.filter(
        (s) => !bookedIds.includes(s.id) && !lockedSeats.includes(s.id)
      );
      if (req.isAIRequest) {
        // Temporary solution for AI response optimization. Need to implement a better way later.
        // To optimse the AI Model token usage, sending metadata to indicate to cut the results
        const aiResponseWithMetadata = {
          metaData: {
            sliceIndex: 3,
            isArray: true,
          },
          responseData: available,
        };
        return aiResponseWithMetadata;
      }
      return res.status(200).json(available);
    } catch (error) {
      if (req.isAIRequest) {
        return { error: error.message || "Error checking availability" };
      }
      next(error);
    }
  },

  lockSeats: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        showId: Yup.number().required(),
        seatIds: Yup.array().of(Yup.number()).required().min(1),
      });
      if (!(await schema.isValid(req.body))) throw new ValidationError();

      const { showId, seatIds } = req.body;
      const show = await Show.findByPk(showId);
      if (!show) throw new BadRequestError("Show not found");

      const client = redisService.getClient();
      const lockId = uuidv4();

      for (const seatId of seatIds) {
        const lockKey = `lock:${showId}:${seatId}`;
        if (await client.exists(lockKey))
          throw new BadRequestError(`Seat ${seatId} is already locked`);

        const booking = await Booking.findOne({
          where: { showId, seatId, status: "booked" },
        });
        if (booking)
          throw new BadRequestError(`Seat ${seatId} is already booked`);

        await client.set(lockKey, lockId, { EX: TTL });
      }
      if (req.isAIRequest) {
        return { lockId, expiresIn: TTL };
      }

      return res.status(200).json({ lockId, expiresIn: TTL });
    } catch (error) {
      if (req.isAIRequest) {
        return { error: error.message || "Error checking availability" };
      }
      next(error);
    }
  },

  bookTicket: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        lockId: Yup.string().required(),
        showId: Yup.number().required(),
        seatIds: Yup.array().of(Yup.number()).required().min(1),
      });
      if (!(await schema.isValid(req.body))) throw new ValidationError();
      const { lockId, showId, seatIds } = req.body;
      const userId = req.userId;
      const client = redisService.getClient();
      // await client.del(await client.keys("lock:*")); // --- IGNORE --- debug line to clear all locks
      const sequelize = sequelizeService.getInstance();

      await sequelize.transaction(async (t) => {
        for (const seatId of seatIds) {
          const lockKey = `lock:${showId}:${seatId}`;
          const storedLock = await client.get(lockKey);

          if (storedLock !== lockId) {
            throw new UnauthorizedError(
              `Invalid or expired lock for seat ${seatId}`
            );
          }

          await Booking.create(
            { userId, showId, seatId, status: "booked" },
            { transaction: t }
          );

          await client.del(lockKey);
        }
      });
      if (req.isAIRequest) {
        return {
          msg: "Tickets booked successfully",
          bookingIds: seatIds,
        };
      }
      return res.status(201).json({
        msg: "Tickets booked successfully",
        bookingIds: seatIds,
      });
    } catch (error) {
      if (req.isAIRequest) {
        return { error: error.message || "Error checking availability" };
      }
      next(error);
    }
  },
};

export default bookingController;
