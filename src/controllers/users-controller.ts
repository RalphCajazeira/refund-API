import type { Request, Response } from "express"

import { prisma } from "@/database/prisma"
import { AppError } from "@/utils/AppError"
import { requireAuth, requireManager, requireSelfOrManager } from "@/utils/auth"
import { UserRole } from "@prisma/client"
import { compare, hash } from "bcrypt"
import { z } from "zod"
import { parseParamId } from "@/utils/params"

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
}

const SALT_ROUNDS = 10

class UsersController {
  async create(request: Request, response: Response) {
    // 1) Validação do body
    const bodySchema = z.object({
      name: z.string().min(2, "O nome precisa ter pelo menos 2 caracteres"),
      email: z.email("Email inválido"),
      password: z
        .string()
        .min(6, "A senha precisa ter pelo menos 6 caracteres"),
      role: z
        .enum(Object.values(UserRole) as [UserRole, ...UserRole[]])
        .default(UserRole.employee),
    })

    const { name, email, password, role } = bodySchema.parse(request.body)

    // 2) Normaliza o email para evitar duplicidade (maiúsculas/minúsculas)
    const emailNormalized = email.toLowerCase()

    // 3) Verifica se já existe usuário com esse email
    const userWithSameEmail = await prisma.user.findUnique({
      where: { email: emailNormalized },
    })

    if (userWithSameEmail) {
      throw new AppError("Já existe um usuário com esse email", 409)
    }

    // 4) Criptografa a senha antes de salvar
    const hashedPassword = await hash(password, SALT_ROUNDS)

    // 5) Cria o usuário no banco
    const user = await prisma.user.create({
      data: {
        name,
        email: emailNormalized,
        password: hashedPassword,
        role,
      },
      // 6) Retorna apenas dados públicos (não retorna password)
      select: userPublicSelect,
    })

    // 7) Retorna o usuário criado
    return response.json({ user })
  }

  async list(request: Request, response: Response) {
    // 1) Garante que o usuário está autenticado (helper)
    const authUser = requireAuth(request.user)

    // 2) Se for manager, lista todos
    //    Se não for, lista apenas o próprio usuário
    const users = await prisma.user.findMany({
      where:
        authUser.role === UserRole.manager ? undefined : { id: authUser.id },

      // 3) Retorna apenas dados públicos
      select: userPublicSelect,
    })

    // 4) Retorna a lista
    return response.json(users)
  }

  async show(request: Request, response: Response) {
    // 1) Garante que o usuário está autenticado (helper)
    const authUser = requireAuth(request.user)

    // 2) Valida o ID vindo na rota
    const userId = parseParamId(request.params)

    // 3) Permissão: manager pode ver qualquer usuário, comum só pode ver ele mesmo (helper)
    requireSelfOrManager(authUser, userId)

    // 4) Busca o usuário no banco
    const userShow = await prisma.user.findUnique({
      where: { id: userId },
      // 5) Retorna apenas dados públicos
      select: userPublicSelect,
    })

    // 6) Se não existir, retorna erro
    if (!userShow) {
      throw new AppError("Usuário não encontrado", 404)
    }

    // 7) Retorna o usuário encontrado
    return response.json(userShow)
  }

  async update(request: Request, response: Response) {
    // 1) Valida o ID vindo na rota
    const userId = parseParamId(request.params)

    // 2) Validação do body (parcial)
    const roles = Object.values(UserRole) as [UserRole, ...UserRole[]]

    const bodySchema = z
      .object({
        name: z.string().min(2, "O nome precisa ter pelo menos 2 caracteres"),
        email: z.email("Digite um email válido"),
        password: z
          .string()
          .min(6, "A senha precisa ter pelo menos 6 caracteres"),
        role: z.enum(roles),
      })
      .partial()

    const body = bodySchema.parse(request.body)

    // 3) Garante que o usuário está autenticado (helper)
    const authUser = requireAuth(request.user)

    // 4) Permissão: manager pode editar qualquer usuário, comum só pode editar ele mesmo (helper)
    requireSelfOrManager(authUser, userId)

    // 5) Se body veio vazio, já responde
    if (Object.keys(body).length === 0) {
      return response.status(200).json({ message: "Nenhuma alteração enviada" })
    }

    // 6) Busca usuário alvo
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new AppError("Usuário não encontrado", 404)
    }

    // 7) Usuário comum não pode alterar role
    const isManager = authUser.role === UserRole.manager
    if (!isManager && body.role !== undefined) {
      throw new AppError("Somente manager pode alterar o cargo", 403)
    }

    // 8) Se mudou email, valida se já existe
    if (body.email !== undefined && body.email !== user.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: body.email.toLowerCase() },
      })

      if (emailInUse) {
        throw new AppError("Email já cadastrado", 409)
      }
    }

    // 9) Monta o objeto "data" SOMENTE com o que realmente mudou
    const data: {
      name?: string
      email?: string
      role?: UserRole
      password?: string
    } = {}

    if (body.name !== undefined && body.name !== user.name) {
      data.name = body.name
    }

    // Normaliza o email antes de comparar/salvar
    if (body.email !== undefined) {
      const emailNormalized = body.email.toLowerCase()
      if (emailNormalized !== user.email) {
        data.email = emailNormalized
      }
    }

    if (body.role !== undefined && body.role !== user.role) {
      data.role = body.role
    }

    // 10) Password: só atualiza se for diferente do hash atual
    if (body.password !== undefined) {
      const samePassword = await compare(body.password, user.password)
      if (!samePassword) {
        data.password = await hash(body.password, SALT_ROUNDS)
      }
    }

    // 11) Se no final não tiver nada pra mudar, não chama update
    if (Object.keys(data).length === 0) {
      return response
        .status(200)
        .json({ message: "Nenhuma alteração detectada" })
    }

    // 12) Atualiza e retorna público
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: userPublicSelect,
    })

    return response.json(updatedUser)
  }

  async remove(request: Request, response: Response) {
    // 1) Valida o ID vindo na rota
    const userId = parseParamId(request.params)

    // 2) Garante que o usuário está autenticado (helper)
    const authUser = requireAuth(request.user)

    // 3) Permissão: manager pode deletar qualquer usuário, comum só pode deletar ele mesmo (helper)
    requireSelfOrManager(authUser, userId)

    // 4) Verifica se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userExists) {
      throw new AppError("Usuário não encontrado", 404)
    }

    // 5) Verifica se existem reembolsos vinculados
    const refundsCount = await prisma.refunds.count({
      where: { userId },
    })

    if (refundsCount > 0) {
      throw new AppError(
        "Não é possível deletar um usuário com reembolsos cadastrados",
        400
      )
    }

    // 6) Deleta o usuário
    await prisma.user.delete({
      where: { id: userId },
    })

    return response.sendStatus(204)
  }
}

export { UsersController }
