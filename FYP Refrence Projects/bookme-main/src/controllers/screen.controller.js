import * as Yup from "yup";
import Screen from "../models/Screen";
import Seat from "../models/Seat";
import Theater from "../models/Theater";
import { BadRequestError, ValidationError } from "../utils/ApiError";
const screenController = {
  add: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        theaterId: Yup.number().required(),
        name: Yup.string().required(),
        totalSeats: Yup.number().required().min(1),
      });

      if (!(await schema.isValid(req.body))) throw new ValidationError();

      const { theaterId, totalSeats } = req.body;

      const screen = await Screen.create({ ...req.body });

      const seats = [];
      for (let i = 1; i <= totalSeats; i++) {
        seats.push({
          screenId: screen.id,
          seatNumber: `A${i}`,
          type: "standard",
        });
      }
      await Seat.bulkCreate(seats);

      return res.status(201).json({ ...screen.toJSON(), seats });
    } catch (error) {
      next(error);
    }
  },

  get: async (req, res, next) => {
    try {
      const screens = await Screen.findAll({
        include: [
          {
            model: Theater,
            attributes: ["name", "location"],
          },
        ],
      });
      return res.status(200).json(screens);
    } catch (error) {
      next(error);
    }
  },

  find: async (req, res, next) => {
    try {
      const { id } = req.params;
      const screen = await Screen.findByPk(id, {
        include: [{ model: Theater }, { model: Seat }],
      });
      if (!screen) throw new BadRequestError("Screen not found");
      return res.status(200).json(screen);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const screen = await Screen.findByPk(id);
      if (!screen) throw new BadRequestError("Screen not found");

      const schema = Yup.object().shape({
        name: Yup.string(),
        totalSeats: Yup.number().min(1),
      });
      if (!(await schema.isValid(req.body))) throw new ValidationError();

      const updated = await screen.update(req.body);
      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const screen = await Screen.findByPk(id);
      if (!screen) throw new BadRequestError("Screen not found");

      await screen.destroy();
      return res.status(200).json({ msg: "Screen deleted" });
    } catch (error) {
      next(error);
    }
  },
};

export default screenController;
