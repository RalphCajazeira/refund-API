import { Router } from "express"

import { usersRoutes } from "./users-routes"
import { sessionsRoutes } from "./sessions-routes"
import { refundsRoutes } from "./refunds-routes"
import { ensureAuthenticated } from "@/middlewares/ensure-authenticated"

const routes = Router()

// Rotas Publicas
routes.use("/users", usersRoutes)
routes.use("/sessions", sessionsRoutes)

//Rotas Privadas
routes.use(ensureAuthenticated)
routes.use("/refunds", refundsRoutes)

export { routes }
