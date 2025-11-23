import * as Yup from "yup";
import Theater from "../models/Theater";
import { BadRequestError, ValidationError } from "../utils/ApiError";

const theaterController = {
  add: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        name: Yup.string().required(),
        location: Yup.string().required(),
      });

      if (!(await schema.isValid(req.body))) throw new ValidationError();

      const { name } = req.body;
      const exists = await Theater.findOne({ where: { name } });
      if (exists) throw new BadRequestError("Theater already exists");

      const theater = await Theater.create(req.body);
      return res.status(201).json(theater);
    } catch (error) {
      next(error);
    }
  },

  get: async (req, res, next) => {
    try {
      const theaters = await Theater.findAll();
      return res.status(200).json(theaters);
    } catch (error) {
      next(error);
    }
  },

  find: async (req, res, next) => {
    try {
      const { id } = req.params;
      const theater = await Theater.findByPk(id);
      if (!theater) throw new BadRequestError("Theater not found");
      return res.status(200).json(theater);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        name: Yup.string(),
        location: Yup.string(),
      });

      if (!(await schema.isValid(req.body))) throw new ValidationError();

      const { id } = req.params;
      const theater = await Theater.findByPk(id);
      if (!theater) throw new BadRequestError("Theater not found");

      const updated = await theater.update(req.body);
      return res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const theater = await Theater.findByPk(id);
      if (!theater) throw new BadRequestError("Theater not found");

      await theater.destroy();
      return res.status(200).json({ msg: "Theater deleted" });
    } catch (error) {
      next(error);
    }
  },
};

export default theaterController;
