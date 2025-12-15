import { AppError } from "@/utils/AppError"
import { ErrorRequestHandler, request, response } from "express"
import { z, ZodError } from "zod"

export const errorHandling: ErrorRequestHandler = (
  error,
  request,
  response,
  next
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
    })
    return
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Validation error",
      issues: z.treeifyError(error),
    })
    return
  }

  response.status(500).json({
    message: error.message || "Internal server error", //Não mostrar detalhes do erro em produção
  })
}
