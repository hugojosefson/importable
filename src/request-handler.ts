import { Entries, filterHeaders } from "./fn.ts";
import { RESPONSE_HEADERS_TO_FORWARD } from "./allowed-response-headers-to-forward.ts";
import { fetchUpstream } from "./fetch-upstream.ts";
import {
  JS_MODULE_WRAPPER_SIZE,
  jsModuleWrapperTransformStream,
} from "./stream/to-module.ts";
import {
  base64Transformer,
  calculateBase64Length,
} from "./stream/binary-data-to-base64-transformer.ts";
import { chunkSizeMultiplesOfNBytesTransformer } from "./stream/chunk-size-multiple-of-n-bytes.ts";
import { errorHandler } from "./error-handler.ts";
import { README_HTML } from "./root-page.ts";

function isLegitimatelyEmptyResponse(
  request: Request,
  response: Response,
): boolean {
  if (request.method.toUpperCase() === "HEAD" && response.ok) {
    return true;
  }
  return [204, 205, 304].includes(response.status);
}

function calculateOurContentLength(upstreamResponse: Response) {
  const upstreamContentLength: number = parseInt(
    upstreamResponse.headers.get("content-length") ?? "NaN",
    10,
  );
  const ourContentLength: number | undefined = isNaN(upstreamContentLength)
    ? undefined
    : (calculateBase64Length(upstreamContentLength) + JS_MODULE_WRAPPER_SIZE);
  return ourContentLength;
}

function createOurResponseBody(request: Request, upstreamResponse: Response) {
  if (isLegitimatelyEmptyResponse(request, upstreamResponse)) {
    return undefined;
  }

  if (!upstreamResponse.body) {
    return undefined;
  }

  return upstreamResponse.body
    .pipeThrough(chunkSizeMultiplesOfNBytesTransformer(3))
    .pipeThrough(base64Transformer())
    .pipeThrough(jsModuleWrapperTransformStream());
}

function createOurResponseHeaders(upstreamResponse: Response) {
  const ourContentLength = calculateOurContentLength(upstreamResponse);
  const anyContentLengthHeaders: Entries = ourContentLength
    ? [["content-length", `${ourContentLength}`]]
    : [];

  const ourResponseHeaders = filterHeaders(
    upstreamResponse.headers,
    RESPONSE_HEADERS_TO_FORWARD,
    [
      ["content-type", "application/javascript; charset=utf-8"],
      ...anyContentLengthHeaders,
    ],
  );
  return ourResponseHeaders;
}

/**
 * Proxies the requested URL to the specified upstream server.
 * Returns a response where the body is a JavaScript Module with a default export that is a base64 encoded string of the upstream response body.
 * @param {Request} request
 * @returns {Response}
 */
export async function requestHandler(request: Request): Promise<Response> {
  try {
    const method = request.method.toUpperCase();
    const url = new URL(request.url);
    if (url.pathname === "/") {
      if (!["HEAD", "GET"].includes(method)) {
        return new Response("Method not allowed", { status: 405 });
      }
      const body: string | undefined = method === "GET"
        ? README_HTML
        : undefined;
      return new Response(
        body,
        {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "content-length": `${README_HTML.length}`,
          },
        },
      );
    }
    const upstreamResponse: Response = await fetchUpstream(request);

    console.debug("Fetched upstream response", upstreamResponse);

    const ourResponseBody: ReadableStream<Uint8Array> | undefined =
      createOurResponseBody(
        request,
        upstreamResponse,
      );
    const ourResponseHeaders: Headers = createOurResponseHeaders(
      upstreamResponse,
    );

    return new Response(
      ourResponseBody,
      {
        status: upstreamResponse.status,
        headers: ourResponseHeaders,
      },
    );
  } catch (error) {
    return errorHandler(error);
  }
}
