import { run } from "@openai/agents";
import { productArchitect } from "./agents";
import { ProductArchitectResult } from "./schemas";

interface Env { DB: D1Database; OPENAI_API_KEY: string }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") return new Response("Agent runtime spike", { status: 200 });
    const body = await request.json() as { user_request?: string };
    if (!body.user_request) return Response.json({ error: "user_request required" }, { status: 400 });
    const runId = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO runs(run_id,created_at,user_request,status) VALUES(?,?,?,?)")
      .bind(runId, new Date().toISOString(), body.user_request, "RUNNING").run();
    try {
      const result = await run(productArchitect, body.user_request);
      const parsed = ProductArchitectResult.parse(result.finalOutput);
      await env.DB.prepare("UPDATE runs SET status=?, structured_result=? WHERE run_id=?")
        .bind("COMPLETED", JSON.stringify(parsed), runId).run();
      return Response.json({ run_id: runId, status: "COMPLETED", result: parsed });
    } catch (error) {
      await env.DB.prepare("UPDATE runs SET status=? WHERE run_id=?").bind("FAILED", runId).run();
      return Response.json({ run_id: runId, status: "FAILED", error: error instanceof Error ? error.message : "unknown" }, { status: 500 });
    }
  }
};
