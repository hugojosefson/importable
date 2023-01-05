import { getValidRequestedUrlOrThrow } from "./allowed-request-url-to-forward.ts";
import { Entry, filterHeaders, indent } from "./fn.ts";
import { REQUEST_HEADERS_TO_FORWARD } from "./allowed-request-headers-to-forward.ts";
import { getValidRequestedMethodOrThrow } from "./allowed-request-methods-to-forward.ts";

function createLogMessage(
  requestedUrl: URL,
  requestHeaders: Headers,
  upstreamResponse: Response,
  request: Request,
) {
  return indent(
    2,
    [
      `Requested URL: ${requestedUrl}`,
      `Requested Headers: ${JSON.stringify(requestHeaders, null, 2)}`,
      `Upstream response URL: ${upstreamResponse.url}`,
      `Upstream response Status: ${upstreamResponse.status} ${upstreamResponse.statusText}`,
      `Upstream response Headers: ${JSON.stringify(request.headers, null, 2)}`,
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
      redirect: "follow",
      method: requestedMethod,
    },
  );

  console.debug(
    [
      "Proxying request",
      createLogMessage(requestedUrl, requestHeaders, upstreamResponse, request),
    ].join("\n"),
  );

  if (upstreamResponse.ok) {
    return upstreamResponse;
  }

  throw new Error([
    "Upstream response not ok.",
    createLogMessage(requestedUrl, requestHeaders, upstreamResponse, request),
  ].join("\n"));
}
