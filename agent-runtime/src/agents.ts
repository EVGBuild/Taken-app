import { Agent } from "@openai/agents";
import { ProductArchitectResult } from "./schemas";
export const productArchitect = new Agent({
  name: "Elise HQ Product Architect",
  instructions: "Translate the supplied Elise HQ work package into coherent product logic. Project Truth is authoritative. Do not invent user decisions. Separate existing decisions, derivations, proposals, and open decisions.",
  outputType: ProductArchitectResult
});
export const orchestrator = new Agent({
  name: "Elise HQ Orchestrator",
  instructions: "Route only the supplied bounded product question. For this spike, determine whether Product Architect should answer it. Do not make external changes."
});
