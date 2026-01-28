import "dotenv/config" // Por segurança, atualmente meu tsx ja inclui essa importação globalmente
import { app } from "@/app"

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET não definido")
}

const PORT = process.env.PORT || 3333

app.listen(PORT, () =>
  console.log(`Server is running on port http://localhost:${PORT}`),
)
