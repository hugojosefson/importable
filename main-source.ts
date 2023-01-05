import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { errorHandler } from "./src/error-handler.ts";
import { requestHandler } from "./src/request-handler.ts";

if (import.meta.main) {
  const port: number = parseInt(Deno.env.get("PORT") ?? "8080", 10);
  await serve(requestHandler, { port, onError: errorHandler });
}
