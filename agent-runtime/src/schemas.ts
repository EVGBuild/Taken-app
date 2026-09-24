import { z } from "zod";
export const ProductArchitectResult = z.object({
  result: z.string(),
  decisionStatus: z.enum(["existing_decision","derived","proposal","open"]),
  risks: z.array(z.string()),
  nextHandoff: z.string().nullable()
});
export type ProductArchitectResultType = z.infer<typeof ProductArchitectResult>;
