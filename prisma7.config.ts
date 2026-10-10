
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Cargar las variables de desarrollo.
// No sobrescribir variables ya definidas en Railway.
config({
  path: ".env.local",
  override: false,
});

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});
