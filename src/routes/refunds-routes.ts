import { Router } from "express"

import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization"
import { RefundsController } from "@/controllers/refunds-controller"
import { UserRole } from "@prisma/client"

const refundsRoutes = Router()
const refundsController = new RefundsController()

refundsRoutes.post(
  "/",
  verifyUserAuthorization([UserRole.employee]),
  refundsController.create,
)
refundsRoutes.get(
  "/",
  verifyUserAuthorization([UserRole.employee, UserRole.manager]),
  refundsController.index,
)
refundsRoutes.get(
  "/:id",
  verifyUserAuthorization([UserRole.employee, UserRole.manager]),
  refundsController.show,
)
refundsRoutes.patch(
  "/:id",
  verifyUserAuthorization([UserRole.employee]),
  refundsController.update,
)
refundsRoutes.delete(
  "/:id",
  verifyUserAuthorization([UserRole.employee]),
  refundsController.remove,
)

export { refundsRoutes }
