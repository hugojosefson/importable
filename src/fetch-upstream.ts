import { REQUEST_HEADERS_TO_FORWARD } from "./allowed-request-headers-to-forward.ts";
import { getValidRequestedMethodOrThrow } from "./allowed-request-methods-to-forward.ts";
import { getValidRequestedUrlOrThrow } from "./allowed-request-url-to-forward.ts";
import { Entry, filterHeaders, headersToEntries, indent } from "./fn.ts";
import { REDIRECT_STATUS_CODES } from "./http-status.ts";

function createLogMessage(
  requestedMethod: string,
  requestedUrl: URL,
  requestHeaders: Headers,
  upstreamResponse: Response,
) {
  return indent(
    2,
    [
      `Request method:            ${requestedMethod}`,
      `Request URL:               ${requestedUrl}`,
      `Request Headers:           ${
        JSON.stringify(Array.from(requestHeaders.entries()))
      }`,
      `Upstream response URL:     ${upstreamResponse.url}`,
      `Upstream response Status:  ${upstreamResponse.status} ${upstreamResponse.statusText}`,
      `Upstream response Headers: `,
    ],
  );
}

export async function fetchUpstream(request: Request): Promise<Response> {
  const requestedMethod = getValidRequestedMethodOrThrow(request);
  const requestedUrl = getValidRequestedUrlOrThrow(request);

  const referrer: Entry = ["referer", new URL(request.url).origin];
  const requestHeaders = filterHeaders(
    request.headers,
    REQUEST_HEADERS_TO_FORWARD,
    [referrer],
  );
  const upstreamResponse = await fetch(
    requestedUrl,
    {
      headers: requestHeaders,
      redirect: "manual",
      method: requestedMethod,
    },
  );

  console.debug(
    [
      "Proxying request",
      createLogMessage(
        requestedMethod,
        requestedUrl,
        requestHeaders,
        upstreamResponse,
      ),
    ].join("\n"),
  );
  console.table(
    Object.fromEntries(headersToEntries(upstreamResponse.headers)),
  );

  if (upstreamResponse.ok) {
    console.debug("Upstream response is OK, returning it");
    return upstreamResponse;
  }

  if (REDIRECT_STATUS_CODES.includes(upstreamResponse.status)) {
    console.debug(
      "Upstream response is a redirect, using it after rewrite",
    );
    return upstreamResponse;
  }

  if (upstreamResponse.status === 404) {
    console.debug("Upstream response is 404, throwing 404 response");
    throw new Response("Not Found", { status: 404 });
  }

  console.error([
    "Upstream response not ok.",
    createLogMessage(
      requestedMethod,
      requestedUrl,
      requestHeaders,
      upstreamResponse,
    ),
  ].join("\n"));
  throw new Response("Bad Gateway", { status: 502 });
}
