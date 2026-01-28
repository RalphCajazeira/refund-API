import { Router } from "express"

import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization"
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated"
import { UsersController } from "@/controllers/users-controller"
import { UserRole } from "@prisma/client"

const usersRoutes = Router()
const usersController = new UsersController()

usersRoutes.post("/", usersController.create)

usersRoutes.use(ensureAuthenticated)

usersRoutes.get(
  "/",
  verifyUserAuthorization([UserRole.employee, UserRole.manager]),
  usersController.index,
)
usersRoutes.get(
  "/:id",
  verifyUserAuthorization([UserRole.employee, UserRole.manager]),
  usersController.show,
)
usersRoutes.patch(
  "/:id",
  verifyUserAuthorization([UserRole.employee, UserRole.manager]),
  usersController.update,
)
usersRoutes.delete(
  "/:id",
  verifyUserAuthorization([UserRole.employee, UserRole.manager]),
  usersController.remove,
)

export { usersRoutes }
