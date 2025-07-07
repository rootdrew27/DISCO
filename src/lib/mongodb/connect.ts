import { User } from "@/types/auth";
import { MongoClient, Db, Collection } from "mongodb";

let client: MongoClient;
let db: Db;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(process.env.MONGODB_DB_NAME);

  return db;
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
  }
}

export async function getUsersCollection(): Promise<Collection<User>> {
  const database = await connectToDatabase();
  return database.collection<User>("users");
}
