import type { Request, Response } from "express"

import { Category, UserRole } from "@prisma/client"
import { AppError } from "@/utils/AppError"
import { prisma } from "@/database/prisma"
import { z } from "zod"

class RefundsController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
      amount: z.number().positive("O valor do reembolso deve ser positivo"),
      category: z.enum(Object.values(Category) as [Category, ...Category[]]),
      filename: z.string(),
    })

    const userId = request.user?.id

    const { name, amount, category, filename } = bodySchema.parse(request.body)

    if (!userId) {
      throw new AppError("Usuário nao encontrado", 404)
    }

    const refund = await prisma.refunds.create({
      data: {
        name,
        amount,
        category,
        filename,
        userId,
      },
    })

    response.json(refund)
  }

  async list(request: Request, response: Response) {
    const { user } = request

    const refunds = await prisma.refunds.findMany({
      where: user?.role === UserRole.manager ? undefined : { userId: user?.id },
    })

    response.json(refunds)
  }

  async show(request: Request, response: Response) {
    response.json({ message: "Reembolsos Listado" })
  }

  async update(request: Request, response: Response) {
    response.json({ message: "Reembolso Atualizado" })
  }

  async remove(request: Request, response: Response) {
    response.json({ message: "Reembolso Removido" })
  }
}

export { RefundsController }
