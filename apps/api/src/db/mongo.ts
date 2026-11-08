import mongoose from "mongoose";

export interface DatabaseStatus {
  connected: boolean;
  /** True when connected to a replica set member, which multi-document transactions require. */
  replicaSet: boolean;
  detail?: string;
}

export interface Database {
  status(): Promise<DatabaseStatus>;
  disconnect(): Promise<void>;
}

/** Connects the default Mongoose connection; feature models register on it. */
export async function connectDatabase(uri: string): Promise<Database> {
  mongoose.set("strictQuery", true);
  // Fail fast rather than silently buffering queries while the database is absent.
  mongoose.set("bufferCommands", false);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const connection = mongoose.connection;

  return {
    async status() {
      const db = connection.db;
      if (connection.readyState !== mongoose.ConnectionStates.connected || !db) {
        return { connected: false, replicaSet: false, detail: "not connected" };
      }
      try {
        const hello = await db.admin().command({ hello: 1 });
        const setName: unknown = hello["setName"];
        const replicaSet = typeof setName === "string" && setName.length > 0;
        return replicaSet
          ? { connected: true, replicaSet }
          : { connected: true, replicaSet, detail: "standalone server; transactions unavailable" };
      } catch {
        return { connected: false, replicaSet: false, detail: "ping failed" };
      }
    },
    async disconnect() {
      await mongoose.disconnect();
    },
  };
}
