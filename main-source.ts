import { handleError } from "./src/handle-error.ts";
import { handleRequest } from "./src/handle-request.ts";

if (import.meta.main) {
  const port: number = parseInt(Deno.env.get("PORT") ?? "8080", 10);
  await Deno.serve({ port, onError: handleError }, handleRequest);
}
