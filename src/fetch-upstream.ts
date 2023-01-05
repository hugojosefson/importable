import { getValidRequestedUrl } from "./get-valid-requested-url.ts";
import { Entry, filterHeaders, indent } from "./fn.ts";
import { REQUEST_HEADERS_TO_FORWARD } from "./allowed-request-headers-to-forward.ts";

export async function fetchUpstream(request: Request): Promise<Response> {
  const requestedUrl = getValidRequestedUrl(request);

  console.debug(`Proxying request to ${requestedUrl}`);
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
    },
  );

  if (!upstreamResponse.ok) {
    const message = [
      "Upstream response not ok.",
      indent(
        2,
        [
          `Requested URL: ${requestedUrl}`,
          `Requested Headers: ${JSON.stringify(requestHeaders, null, 2)}`,
          `Upstream response URL: ${upstreamResponse.url}`,
          `Upstream response Status: ${upstreamResponse.status} ${upstreamResponse.statusText}`,
          `Upstream response Headers: ${
            JSON.stringify(request.headers, null, 2)
          }`,
        ],
      ),
    ].join("\n");
    throw new Error(message);
  }

  return upstreamResponse;
}
