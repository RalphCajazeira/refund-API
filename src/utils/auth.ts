import { AppError } from "@/utils/AppError"
import { UserRole } from "@prisma/client"

type AuthUser = {
  id: string
  role: UserRole
}

// 1) Garante que existe usuário logado
export function requireAuth(authUser: AuthUser | undefined) {
  if (!authUser) {
    throw new AppError("Usuário não encontrado", 404) // ou 401
  }
  return authUser
}

// 2) Permissão: manager ou o próprio usuário (quando o targetUserId vem da rota /users/:id)
export function requireSelfOrManager(authUser: AuthUser, targetUserId: string) {
  const isManager = authUser.role === UserRole.manager
  const isSelf = authUser.id === targetUserId

  if (!isManager && !isSelf) {
    throw new AppError("Usuário não autorizado", 403)
  }
}

// 3) Permissão: manager ou dono do recurso (ex: refund.userId vindo do banco)
export function requireOwnerOrManager(authUser: AuthUser, ownerId: string) {
  const isManager = authUser.role === UserRole.manager
  const isOwner = authUser.id === ownerId

  if (!isManager && !isOwner) {
    throw new AppError("Usuário não autorizado", 403)
  }
}

// 4) Permissão: somente manager
export function requireManager(authUser: AuthUser) {
  if (authUser.role !== UserRole.manager) {
    throw new AppError("Usuário não autorizado", 403)
  }
}
