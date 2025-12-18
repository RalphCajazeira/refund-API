import {
  type Request,
  type Response,
  type NextFunction,
  request,
} from "express"
import { AppError } from "@/utils/AppError"

function verifyUserAuthorization(role: string[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user || !role.includes(request.user.role)) {
      throw new AppError("Usuário não autorizado", 403)
    }
    return next()
  }
}

export { verifyUserAuthorization }
