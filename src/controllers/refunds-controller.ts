import type { Request, Response } from "express"

import { Category, UserRole } from "@prisma/client"
import {
  requireAuth,
  requireManager,
  requireOwnerOrManager,
  requireSelfOrManager,
} from "@/utils/auth"
import { prisma } from "@/database/prisma"
import { z } from "zod"
import { AppError } from "@/utils/AppError"
import { parseParamId } from "@/utils/params"

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
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    return response.status(201).json(refund)
  }

  async index(request: Request, response: Response) {
    // 1) Garante que o usuário está autenticado
    const authUser = requireAuth(request.user)

    // 2) Valida query
    const querySchema = z.object({
      name: z.string().optional().default(""),
      page: z.coerce.number().optional().default(1),
      perPage: z.coerce.number().optional().default(3),
    })

    // 2.1) Valida query
    const { name, page, perPage } = querySchema.parse(request.query)
    const nameTrimmed = name.trim()

    // 3) Calcula o skip
    const skip = (page - 1) * perPage

    // 4) Consulta com filtros usando spread (...)
    const refunds = await prisma.refunds.findMany({
      skip,
      take: perPage,
      where: {
        // Se não for manager, limita ao próprio usuário
        ...(authUser.role !== UserRole.manager && {
          userId: authUser.id,
        }),

        // Se veio name (não vazio), filtra por nome
        ...(nameTrimmed !== "" && {
          user: {
            name: {
              contains: nameTrimmed,
            },
          },
        }),
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const totalRecords = await prisma.refunds.count({
      where: {
        // Se não for manager, limita ao próprio usuário
        ...(authUser.role !== UserRole.manager && {
          userId: authUser.id,
        }),

        // Se veio name (não vazio), filtra por nome
        ...(nameTrimmed !== "" && {
          user: {
            name: {
              contains: nameTrimmed,
            },
          },
        }),
      },
    })

    // 5) Calcula total de páginas
    const totalPages = Math.ceil(totalRecords / perPage)

    // 6) Retorna a lista de refunds com metadados de paginação
    return response.json({
      refunds,
      pagination: {
        page,
        perPage,
        totalRecords,
        totalPages: totalPages > 0 ? totalPages : 1,
      },
    })
  }

  async show(request: Request, response: Response) {
    // 1) Garante que o usuário está autenticado
    const authUser = requireAuth(request.user)

    // 2) Pega e valida o ID do refund vindo da rota (/refunds/:id)
    const refundId = parseParamId(request.params)

    // 3) Busca o refund no banco
    const refund = await prisma.refunds.findUnique({
      where: { id: refundId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    // 4) Se não existir, retorna 404
    if (!refund) {
      throw new AppError("Reembolso não encontrado", 404)
    }

    // 5) Permissão:
    //    - manager pode ver qualquer refund
    //    - usuário comum só pode ver se o refund for dele
    requireOwnerOrManager(authUser, refund.userId)

    // 6) Retorna o refund
    return response.json(refund)
  }

  async update(request: Request, response: Response) {
    // 1) Pega e valida o ID do refund vindo da rota (/refunds/:id)
    const refundId = parseParamId(request.params)

    // 2) Validação do body (parcial)
    const bodySchema = z
      .object({
        name: z
          .string()
          .min(3, "Nome deve ter no mínimo 3 caracteres")
          .optional(),
        amount: z
          .number()
          .positive("O valor do reembolso deve ser positivo")
          .optional(),
        category: z
          .enum(Object.values(Category) as [Category, ...Category[]])
          .optional(),
        filename: z.string().optional(),
      })
      .partial()

    const body = bodySchema.parse(request.body)

    // 3) Garante que o usuário está autenticado
    const authUser = requireAuth(request.user)

    // 4) Se não veio nada no body, não faz update
    if (Object.keys(body).length === 0) {
      return response.status(200).json({ message: "Nenhuma alteração enviada" })
    }

    // 5) Busca o refund no banco
    const refund = await prisma.refunds.findUnique({
      where: { id: refundId },
    })

    if (!refund) {
      throw new AppError("Reembolso não encontrado", 404)
    }

    // 6) Permissão: manager pode alterar qualquer refund, usuário comum só o dele
    requireOwnerOrManager(authUser, refund.userId)

    // 7) Monta o objeto "data" SOMENTE com o que realmente mudou
    // (isso evita atualizar updatedAt sem necessidade)
    const data: Partial<{
      name: string
      amount: number
      category: Category
      filename: string
    }> = {}

    if (body.name !== undefined && body.name !== refund.name) {
      data.name = body.name
    }

    if (body.amount !== undefined && body.amount !== refund.amount) {
      data.amount = body.amount
    }

    if (body.category !== undefined && body.category !== refund.category) {
      data.category = body.category
    }

    if (body.filename !== undefined && body.filename !== refund.filename) {
      data.filename = body.filename
    }

    // 8) Se no final não tiver nada pra mudar, não chama update
    if (Object.keys(data).length === 0) {
      return response
        .status(200)
        .json({ message: "Nenhuma alteração detectada" })
    }

    // 9) Atualiza no banco
    const updatedRefund = await prisma.refunds.update({
      where: { id: refundId },
      data,
    })

    return response.json(updatedRefund)
  }

  async remove(request: Request, response: Response) {
    // 1) Valida o ID vindo na rota
    const refundId = parseParamId(request.params)

    // 2) Garante que o usuário está autenticado (helper)
    const authUser = requireAuth(request.user)

    // 3) Busca o refund no banco
    const refund = await prisma.refunds.findUnique({
      where: { id: refundId },
    })

    // 4) Se nao existir, retorna erro
    if (!refund) {
      throw new AppError("Reembolso nao encontrado", 404)
    }

    // 4) Permissão: manager pode deletar qualquer refund, comum só pode deletar o dele mesmo (helper)
    requireOwnerOrManager(authUser, refund.userId)

    // 5) Deleta o refund
    await prisma.refunds.delete({
      where: { id: refundId },
    })

    return response.status(204).send()
  }
}

export { RefundsController }
