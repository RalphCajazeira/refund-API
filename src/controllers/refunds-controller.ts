import type { Request, Response } from "express"

import { Category, UserRole } from "@prisma/client"
import { requireAuth } from "@/utils/auth"
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

    const { name, amount, category, filename } = bodySchema.parse(request.body)

    const userId = requireAuth(request.user).id

    const refund = await prisma.refunds.create({
      data: {
        name,
        amount,
        category,
        filename,
        userId,
      },
    })

    return response.json(refund)
  }

  async list(request: Request, response: Response) {
    const authUser = requireAuth(request.user)

    const refunds = await prisma.refunds.findMany({
      where:
        authUser.role === UserRole.manager
          ? undefined
          : { userId: authUser.id },
    })

    return response.json(refunds)
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
