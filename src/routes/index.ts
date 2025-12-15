import { Router } from "express"

import { usersRoutes } from "./users-routes"

const routes = Router()

// Rotas Publicas
routes.use("/users", usersRoutes)

export { routes }
