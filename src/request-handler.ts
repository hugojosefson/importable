import { filterHeaders } from "./fn.ts";
import { RESPONSE_HEADERS_TO_FORWARD } from "./allowed-response-headers-to-forward.ts";
import { fetchUpstream } from "./fetch-upstream.ts";
import { JsModuleWrapperTransformStream } from "./stream/to-module.ts";
import { ChunkSizeMultiplesOfNBytesTransformer } from "./stream/chunk-size-multiple-of-n-bytes.ts";
import { BinaryDataToBase64Transformer } from "./stream/binary-data-to-base64-transformer.ts";

function isEmptyResponseAndShouldForwardHeaders(response: Response): boolean {
  return [204, 205, 304].includes(response.status);
}

/**
 * Proxies the requested URL to the specified upstream server.
 * Returns a response where the body is a JavaScript Module with a default export that is a base64 encoded string of the upstream response body.
 * @param {Request} request
 * @returns {Response}
 */
export async function requestHandler(request: Request): Promise<Response> {
  const upstreamResponse = await fetchUpstream(request);

  if (isEmptyResponseAndShouldForwardHeaders(upstreamResponse)) {
    return new Response(null, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: filterHeaders(
        upstreamResponse.headers,
        RESPONSE_HEADERS_TO_FORWARD,
      ),
    });
  }

  if (!upstreamResponse.body) {
    return new Response("No body in upstream response.", { status: 500 });
  }

  const jsModuleReadable: ReadableStream<Uint8Array> = upstreamResponse.body
    .pipeThrough(new ChunkSizeMultiplesOfNBytesTransformer(3))
    .pipeThrough(new BinaryDataToBase64Transformer())
    .pipeThrough(new JsModuleWrapperTransformStream());

  // return a new Response with the readable stream as the body
  return new Response(jsModuleReadable, {
    status: upstreamResponse.status,
    headers: filterHeaders(
      upstreamResponse.headers,
      RESPONSE_HEADERS_TO_FORWARD,
      { "content-type": "application/javascript; charset=utf-8" },
    ),
  });
}
