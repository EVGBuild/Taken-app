import { describe, expect, it } from "vitest";
import { ProductArchitectResult } from "../src/schemas";
describe("ProductArchitectResult",()=>{it("rejects ambiguous decision status",()=>{expect(()=>ProductArchitectResult.parse({result:"x",decisionStatus:"decided",risks:[],nextHandoff:null})).toThrow();});});
