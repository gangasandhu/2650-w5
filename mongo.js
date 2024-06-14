import "dotenv/config.js";
import { MongoClient } from "mongodb"
const uri = process.env.MONGOURI

let db;

async function connectToDatabase() {
  if (db) return db;
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  db = client.db(process.env.MONGODBNAME);
  return db;
}

export default connectToDatabase;
