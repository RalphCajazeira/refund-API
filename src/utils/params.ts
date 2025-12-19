import z from "zod"

export function parseParamId(params: any) {
  const paramsSchema = z.object({
    id: z.uuid("ID inválido"),
  })

  return paramsSchema.parse(params).id
}
