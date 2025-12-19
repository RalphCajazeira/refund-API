import { Router } from "express"

import { UsersController } from "@/controllers/users-controller"
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated"
import { UserRole } from "@prisma/client"
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization"

const usersRoutes = Router()
const usersController = new UsersController()

usersRoutes.post("/", usersController.create)

usersRoutes.use(ensureAuthenticated)

usersRoutes.get(
  "/",
  verifyUserAuthorization([UserRole.employee, UserRole.manager]),
  usersController.list
)
usersRoutes.get(
  "/:id",
  verifyUserAuthorization([UserRole.employee, UserRole.manager]),
  usersController.show
)
usersRoutes.put(
  "/:id",
  verifyUserAuthorization([UserRole.employee, UserRole.manager]),
  usersController.update
)
usersRoutes.delete(
  "/:id",
  verifyUserAuthorization([UserRole.employee, UserRole.manager]),
  usersController.remove
)

export { usersRoutes }
