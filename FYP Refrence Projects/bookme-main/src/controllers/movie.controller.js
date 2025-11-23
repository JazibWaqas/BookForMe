import * as Yup from "yup";
import Movie from "../models/Movie";

const movieController = {
  add: async (req, res, next) => {
    try {
      const schema = Yup.object().shape({
        name: Yup.string().required(),
        duration: Yup.number().required(),
      });
      if (!(await schema.isValid(req.body))) throw new ValidationError();
      const movie = await Movie.create(req.body);
      return res.status(201).json(movie);
    } catch (error) {
      next(error);
    }
  },
  get: async (req, res, next) => {
    try {
      const movies = await Movie.findAll();
      return res.status(200).json(movies);
    } catch (error) {
      next(error);
    }
  },
};

export default movieController;
