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
refundsRoutes.get("/", refundsController.list)
refundsRoutes.get("/:id", refundsController.show)
refundsRoutes.put("/:id", refundsController.update)
refundsRoutes.delete("/:id", refundsController.remove)

export { refundsRoutes }
