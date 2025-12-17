import { Router } from "express"

import { RefundsController } from "@/controllers/refunds-controller"

const refundsRoutes = Router()
const refundsController = new RefundsController()

refundsRoutes.post("/", refundsController.create)
refundsRoutes.get("/", refundsController.list)
refundsRoutes.get("/:id", refundsController.show)
refundsRoutes.put("/:id", refundsController.update)
refundsRoutes.delete("/:id", refundsController.remove)

export { refundsRoutes }
