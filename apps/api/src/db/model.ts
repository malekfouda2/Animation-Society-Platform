import mongoose, { type Schema } from "mongoose";

/**
 * Registers a model with its schema's inferred types. A second registration under the same name
 * (watch mode, tests importing a module twice) replaces the first instead of throwing.
 */
export function defineModel<S extends Schema>(name: string, schema: S) {
  if (name in mongoose.models) mongoose.deleteModel(name);
  return mongoose.model(name, schema);
}
