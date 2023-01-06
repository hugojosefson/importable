import { README_HTML, README_HTML_LENGTH } from "./root-page.ts";

export function handleRootRequest(request: Request) {
  const init: ResponseInit = {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "content-length": `${README_HTML_LENGTH}`,
    },
  };

  const method: string = request.method.toUpperCase();
  if (method === "HEAD") {
    return new Response(undefined, init);
  }
  if (method === "GET") {
    return new Response(README_HTML, init);
  }
  return new Response("Method not allowed", { status: 405 });
}
