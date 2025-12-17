import { Router } from "express"

import { usersRoutes } from "./users-routes"
import { sessionsRoutes } from "./sessions-routes"
import { refundsRoutes } from "./refunds-routes"

const routes = Router()

// Rotas Publicas
routes.use("/users", usersRoutes)
routes.use("/sessions", sessionsRoutes)

//Rotas Privadas
routes.use("/refunds", refundsRoutes)

export { routes }
