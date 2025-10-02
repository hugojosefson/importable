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
import { handleError } from "./handle-error.ts";
import { handleRootRequest } from "./handle-root-request.ts";
import { EMPTY_STATUS_CODES, REDIRECT_STATUS_CODES } from "./http-status.ts";
import {
  getOurBaseUrl,
  getValidRequestedUrlOrThrow,
} from "./allowed-request-url-to-forward.ts";

function isLegitimatelyEmptyResponse(
  request: Request,
  response: Response,
): boolean {
  if (request.method.toUpperCase() === "HEAD" && response.ok) {
    return true;
  }
  if (EMPTY_STATUS_CODES.includes(response.status)) {
    return true;
  }
  return false;
}
function isRedirectResponse(
  response: Response,
): boolean {
  return REDIRECT_STATUS_CODES.includes(response.status);
}

function calculateOurContentLength(
  ourResponseBody: ReadableStream<Uint8Array> | undefined,
  upstreamResponse: Response,
) {
  if (!ourResponseBody) {
    return 0; // because createOurResponseBody returns undefined in that case
  }
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

  if (isRedirectResponse(upstreamResponse)) {
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

function calculateRedirectLocation(
  request: Request,
  upstreamResponse: Response,
) {
  const requestedUrl = getValidRequestedUrlOrThrow(request);
  const upstreamResponseLocation = upstreamResponse.headers.get("location") ??
    "";
  const absoluteLocation = new URL(upstreamResponseLocation, requestedUrl);
  console.debug({
    requestedUrl,
    upstreamResponseLocation,
    absoluteLocation,
  });
  return getOurBaseUrl(request).href + absoluteLocation.href;
}

function createOurResponseHeaders(
  request: Request,
  upstreamResponse: Response,
  ourResponseBody: ReadableStream<Uint8Array> | undefined,
) {
  const ourContentLength = calculateOurContentLength(
    ourResponseBody,
    upstreamResponse,
  );
  const anyContentLengthHeaders: Entries = typeof ourContentLength === "number"
    ? [["content-length", `${ourContentLength}`]]
    : [];
  const anyLocationHeaders: Entries = isRedirectResponse(upstreamResponse)
    ? [["location", calculateRedirectLocation(request, upstreamResponse) ?? ""]]
    : [];

  const ourResponseHeaders = filterHeaders(
    upstreamResponse.headers,
    RESPONSE_HEADERS_TO_FORWARD,
    [
      ["content-type", "application/javascript; charset=utf-8"],
      ...anyContentLengthHeaders,
      ...anyLocationHeaders,
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
export async function handleRequest(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    if (url.pathname === "/") {
      return handleRootRequest(request);
    }
    const upstreamResponse: Response = await fetchUpstream(request);

    console.debug("Fetched upstream response", upstreamResponse);

    const ourResponseBody: ReadableStream<Uint8Array> | undefined =
      createOurResponseBody(
        request,
        upstreamResponse,
      );
    const ourResponseHeaders: Headers = createOurResponseHeaders(
      request,
      upstreamResponse,
      ourResponseBody,
    );

    return new Response(
      ourResponseBody,
      {
        status: upstreamResponse.status,
        headers: ourResponseHeaders,
      },
    );
  } catch (error) {
    return handleError(error);
  }
}
