import { AppError } from "@/utils/AppError"
import { UserRole } from "@prisma/client"

// Tipo simples do que eu preciso do usuário autenticado
type AuthUser = {
  id: string
  role: UserRole
}

// 1) Garante que existe usuário logado
export function requireAuth(authUser: AuthUser | undefined) {
  if (!authUser) {
    throw new AppError("Usuário não encontrado", 404) // poderia ser 401 também
  }

  return authUser
}

// 2) Permissão: manager ou o próprio usuário
export function requireSelfOrManager(authUser: AuthUser, targetUserId: string) {
  const isManager = authUser.role === UserRole.manager
  const isSelf = authUser.id === targetUserId

  if (!isManager && !isSelf) {
    throw new AppError("Usuário não autorizado", 403)
  }
}

// 3) Permissão: somente manager
export function requireManager(authUser: AuthUser) {
  if (authUser.role !== UserRole.manager) {
    throw new AppError("Usuário não autorizado", 403)
  }
}
