import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const url = process.env.DATABASE_URL
if (!url) {
  throw new Error("DATABASE_URL não definida")
}

export const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url, // ex: "file:./dev.db"
  }),
  log: ["query"],
})
