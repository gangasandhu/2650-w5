// server.js
import express from "express";
import { ObjectId } from "mongodb";
import connectToDatabase from "./mongo.js";
import redis from "redis";

const app = express();
const port = 3000;

// redis setup
let redisClient;

(async () => {
  redisClient = redis.createClient();

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();

app.use(express.json());

const setCache = async (key, value) => {
  await redisClient.set(key, JSON.stringify(value));
};

const getCache = async (key) => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};


// GET: Get the first 10 Movies
app.get('/movies', async (req, res) => {
  const cachedMovies = await getCache("movies");
  if(cachedMovies) {
    return res.json(cachedMovies)
  }
  const db = await connectToDatabase();
  const movies = await db.collection('movies').find({}, {projection: { _id: 1, name: 1, title: 1 }}).limit(10).toArray();
  await setCache("movies", movies)
  res.json(movies);
});

// GET: Get one Movie by its ID
app.get('/movie/:id', async (req, res) => {
  const { id } = req.params;

  // check if the movie is cached
  const cachedMovie = await getCache(id);
  if (cachedMovie) {
    return res.json(cachedMovie)
  }

  const db = await connectToDatabase();
  const movie = await db
    .collection('movies')
    .findOne({ _id: new ObjectId(id) }, { projection: { _id: 1, name: 1, title: 1 } });
  if (movie) {
    await setCache(id, movie)
    res.json(movie);
  } else {
    res.status(404).send('Movie not found');
  }
});

// PATCH Update one Movie's title by its ID
app.patch('/movie/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const db = await connectToDatabase();
  const result = await db.collection('movies').updateOne(
    { _id: new ObjectId(id) },
    { $set: { title: title } }
  );
  if (result) {
    const updatedMovie = await db.collection('movies').findOne(
      { _id: new ObjectId(id) },
      { projection: { _id: 1, name: 1, title: 1 } }
    );
    await setCache(id, updatedMovie);
    await redisClient.del("movies");

    res.send('Movie title updated');
  } else {
    res.status(404).send('Movie not found');
  }
});

// DELETE 
app.delete('/movie/:id', async (req, res) => {
  const { id } = req.params;
  const db = await connectToDatabase();
  const result = await db.collection('movies').deleteOne({ _id: new ObjectId(id) });
  if (result) {
    await redisClient.del(id);
    await redisClient.del("movies");
    res.send('Movie deleted');
  } else {
    res.status(404).send('Movie not found');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
