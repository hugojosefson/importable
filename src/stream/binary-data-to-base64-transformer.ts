import { toTransformStream } from "@std/streams/to-transform-stream";
import { encodeBase64 } from "@std/encoding/base64";

export function base64Chunk(chunk: Uint8Array): Uint8Array {
  const base64 = encodeBase64(Uint8Array.from(chunk));
  const bytes = new TextEncoder().encode(base64);
  return bytes;
}

export function calculateBase64Length(bytes: number): number {
  return Math.ceil(bytes / 3) * 4;
}

export function base64Transformer(): TransformStream<Uint8Array, Uint8Array> {
  return mapTransformer(base64Chunk);
}

export function mapTransformer<T, U>(
  chunkMapper: (chunk: T) => U | PromiseLike<U>,
): TransformStream<T, U> {
  return toTransformStream(
    async function* (src: ReadableStream<T>): AsyncGenerator<U> {
      for await (const chunk of src) {
        yield chunkMapper(chunk);
      }
    },
  );
}
