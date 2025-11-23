import * as Yup from "yup";
import Show from "../models/Show";
import Screen from "../models/Screen";
import Movie from "../models/Movie";
import { Op } from "sequelize";

import { BadRequestError, ValidationError } from "../utils/ApiError";

const showController = {
  add: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        movieId: Yup.number().required(),
        screenId: Yup.number().required(),
        startTime: Yup.date().required(),
        endTime: Yup.date().required(),
      });
      if (!(await schema.isValid(req.body))) throw new ValidationError();
      if (new Date(req.body.endTime) <= new Date(req.body.startTime))
        throw new BadRequestError("Invalid times");
      const show = await Show.create(req.body);
      return res.status(201).json(show);
    } catch (error) {
      next(error);
    }
  },
  get: async (req, res, next) => {
    try {
      const { movieId, movieName, theaterId, date } = req.query;

      const where = {};

      if (movieId) where.movieId = movieId;

      if (date) {
        const startOfDay = new Date(`${date}T00:00:00Z`);
        const endOfDay = new Date(`${date}T23:59:59Z`);
        where.startTime = { [Op.between]: [startOfDay, endOfDay] };
      }

      const shows = await Show.findAll({
        where,
        include: [
          {
            model: Screen,
            where: theaterId ? { theaterId } : undefined,
          },
          {
            model: Movie,
            attributes: ["id", "name", "duration"],
            where: movieName
              ? {
                  name: { [Op.iLike]: `%${movieName}%` },
                }
              : undefined,
          },
        ],
        order: [["startTime", "ASC"]],
      });

      if (req.isAIRequest) return shows;

      return res.status(200).json(shows);
    } catch (error) {
      next(error);
    }
  },
};

export default showController;
