import express from "express";
import Movie from "../mongo.js";

const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Yay node!" });
});

router.get("/movies", async (req, res, next) => {
  const movies = await Movie.findOne({});
  res.json(movies);
})

export default router;
