import { Router } from "express";
import movieController from "../controllers/movie.controller";
import { validate } from "../middlewares/validate.middleware";
import * as Yup from "yup";

const movieRoutes = Router();

const addMovieSchema = Yup.object()
  .shape({
    name: Yup.string().required("Movie name is required"),
    startAt: Yup.string().nullable(),
    endAt: Yup.string().nullable(),
    duration: Yup.number().nullable(),
  })
  .test(
    "duration-or-endAt",
    "Either duration or endAt must be provided",
    (value) => {
      if (!value) return false;
      return typeof value.duration === "number" || !!value.endAt;
    }
  );

movieRoutes.post("/movies", validate(addMovieSchema), movieController.add);
movieRoutes.get("/movies", movieController.get);

export { movieRoutes };
