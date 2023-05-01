#!/usr/bin/env -S deno run --allow-net=unpkg.com,esm.sh,cdn.jsdelivr.net,cdn.skypack.dev,jspm.dev,deno.land,raw.githubusercontent.com,github.com,codeload.github.com,0.0.0.0 --allow-env=PORT --allow-read=README.html
import { serve } from "https://deno.land/std@0.185.0/http/server.ts";
import { handleError } from "./src/handle-error.ts";
import { handleRequest } from "./src/handle-request.ts";

if (import.meta.main) {
  const port: number = parseInt(Deno.env.get("PORT") ?? "8080", 10);
  await serve(handleRequest, { port, onError: handleError });
}
