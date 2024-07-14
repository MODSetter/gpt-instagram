import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/drizzle/schema.ts",
  out: "./app/drizzle/migrations",
  dialect: "postgresql",
  verbose: true,
  strict: true,
});
