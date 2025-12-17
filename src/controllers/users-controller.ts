import type { Request, Response } from "express"

import { prisma } from "@/database/prisma"
import { AppError } from "@/utils/AppError"
import { UserRole } from "@prisma/client"
import { hash } from "bcrypt"
import { z } from "zod"

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
}

class UsersController {
  async create(request: Request, response: Response) {
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

    const userWithSameEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (userWithSameEmail) {
      throw new AppError("Já existe um usuário com esse email", 409)
    }

    const hashedPassword = await hash(password, 8)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
      select: userPublicSelect,
    })

    response.json({ user })
  }

  async list(request: Request, response: Response) {
    const users = await prisma.user.findMany({
      select: userPublicSelect,
    })

    response.json(users)
  }

  async show(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.uuid("ID inválido"),
    })

    const { id: userId } = paramsSchema.parse(request.params)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userPublicSelect,
    })

    if (user) {
      return response.json(user)
    }
    throw new AppError("Usuário não encontrado", 404)
  }

  async remove(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.uuid("ID inválido"),
    })

    const { id: userId } = paramsSchema.parse(request.params)

    await prisma.user.delete({
      where: { id: userId },
    })

    response.sendStatus(204)
  }

  async update(request: Request, response: Response) {
    const paramsSchema = z.object({
      id: z.uuid("ID inválido"),
    })

    const bodySchema = z.object({
      name: z.string().min(2).optional(),
      email: z.email().optional(),
      password: z.string().min(6).optional(),
      role: z
        .enum(Object.values(UserRole) as [UserRole, ...UserRole[]])
        .optional(),
    })

    const { id: userId } = paramsSchema.parse(request.params)
    const { name, email, password, role } = bodySchema.parse(request.body)

    // 1️⃣ Verifica se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new AppError("Usuário não encontrado", 404)
    }

    // 2️⃣ Se email mudou, valida duplicidade (ignorando ele mesmo)
    if (email && email !== user.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email },
      })

      if (emailInUse) {
        throw new AppError("Email já cadastrado", 409)
      }
    }

    // 3️⃣ Monta dados SOMENTE do que mudou
    const data: any = {}

    if (name && name !== user.name) data.name = name
    if (email && email !== user.email) data.email = email
    if (role && role !== user.role) data.role = role
    if (password && password !== user.password) data.password = password

    // 4️⃣ Se nada mudou, não atualiza no banco
    if (Object.keys(data).length === 0) {
      return response
        .status(200)
        .json({ message: "Nenhuma alteração detectada" })
    }

    // 5️⃣ Atualiza
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: userPublicSelect,
    })

    return response.json(updatedUser)
  }
}

export { UsersController }
