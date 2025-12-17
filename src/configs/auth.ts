import { Secret, SignOptions } from "jsonwebtoken"

export const authConfig = {
  jwt: {
    secret: process.env.JWT_SECRET as Secret,
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"],
  },
}
