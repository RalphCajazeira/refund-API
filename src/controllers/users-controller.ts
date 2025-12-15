import { Request, Response } from "express"
import { z } from "zod"

class UsersController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z.string(),
      email: z.email(),
      password: z.string().min(6),
    })

    const { name, email, password } = bodySchema.parse(request.body)

    response.json({ name, email, password })
  }
}

export { UsersController }
