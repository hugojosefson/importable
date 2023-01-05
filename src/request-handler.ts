import { filterHeaders } from "./fn.ts";
import {
  getDesiredChunkSizeTransformer,
  readerWithDesiredChunkSize,
} from "./stream/reader-with-desired-chunk-size.ts";
import { binaryDataToBase64Transformer } from "./stream/binary-data-to-base64-transformer.ts";
import { RESPONSE_HEADERS_TO_FORWARD } from "./allowed-response-headers-to-forward.ts";
import { fetchUpstream } from "./fetch-upstream.ts";
import { wrapInJsModule } from "./stream/to-module.ts";

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

  const chunkSizeTransformer = getDesiredChunkSizeTransformer(3);

  const reader = readerWithDesiredChunkSize(
    upstreamResponse.body.getReader(),
    chunkSizeTransformer,
  );

  // transform using the binaryDataToBase64Transformer
  const base64EncodedDataReader = new TransformStream(
    binaryDataToBase64Transformer,
  );

  // pipe the binary data to the base64 transformer
  binaryDataReaderWithChunkSize.pipeTo(base64EncodedDataReader.writable);

  // wrap with wrapInJsModule
  const jsModuleReadable = wrapInJsModule(base64EncodedDataReader.readable);

  // return a new Response with the readable stream as the body
  return new Response(jsModuleReadable, {
    status: upstreamResponse.status,
    headers: filterHeaders(
      upstreamResponse.headers,
      RESPONSE_HEADERS_TO_FORWARD,
      [["content-type", "application/javascript"]],
    ),
  });
}
