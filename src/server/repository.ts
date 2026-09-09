import type { Collection, Db, Document, Filter, OptionalUnlessRequiredId, UpdateFilter, WithId } from "mongodb";
import { getMongoDb } from "./mongodb.js";

export async function collection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  const db: Db = await getMongoDb();
  return db.collection<T>(name);
}

export async function findById<T extends Document>(name: string, id: string): Promise<WithId<T> | null> {
  const c = await collection<T>(name);
  return c.findOne({ _id: id as any } as Filter<T>);
}

export async function findOne<T extends Document>(name: string, filter: Filter<T>): Promise<WithId<T> | null> {
  return (await collection<T>(name)).findOne(filter);
}

export async function insertOne<T extends Document>(name: string, document: OptionalUnlessRequiredId<T>) {
  return (await collection<T>(name)).insertOne(document);
}

export async function updateOne<T extends Document>(name: string, filter: Filter<T>, update: UpdateFilter<T>) {
  return (await collection<T>(name)).updateOne(filter, update);
}

export async function deleteOne<T extends Document>(name: string, filter: Filter<T>) {
  return (await collection<T>(name)).deleteOne(filter);
}
