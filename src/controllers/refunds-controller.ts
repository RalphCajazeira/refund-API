import type { Request, Response } from "express"

class RefundsController {
  async create(request: Request, response: Response) {
    response.json({ message: "Reembolso Criado" })
  }

  async list(request: Request, response: Response) {
    response.json({ message: "Reembolsos Listados" })
  }

  async show(request: Request, response: Response) {
    response.json({ message: "Reembolsos Listado" })
  }

  async update(request: Request, response: Response) {
    response.json({ message: "Reembolso Atualizado" })
  }

  async remove(request: Request, response: Response) {
    response.json({ message: "Reembolso Removido" })
  }
}

export { RefundsController }
