import { Router } from "express"

import { RefundsController } from "@/controllers/refunds-controller"
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization"
import { UserRole } from "@prisma/client"

const refundsRoutes = Router()
const refundsController = new RefundsController()

refundsRoutes.post(
  "/",
  verifyUserAuthorization([UserRole.employee]),
  refundsController.create
)
refundsRoutes.get(
  "/",
  verifyUserAuthorization([UserRole.employee, UserRole.manager]),
  refundsController.list
)
refundsRoutes.get(
  "/:id",
  verifyUserAuthorization([UserRole.employee, UserRole.manager]),
  refundsController.show
)
refundsRoutes.put(
  "/:id",
  verifyUserAuthorization([UserRole.employee]),
  refundsController.update
)
refundsRoutes.delete(
  "/:id",
  verifyUserAuthorization([UserRole.employee]),
  refundsController.remove
)

export { refundsRoutes }
