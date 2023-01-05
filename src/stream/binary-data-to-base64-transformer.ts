import { toTransformStream } from "https://deno.land/std@0.171.0/streams/to_transform_stream.ts";
import { encode as base64encode } from "https://deno.land/std@0.171.0/encoding/base64.ts";

export function base64Chunk(chunk: Uint8Array): Uint8Array {
  const base64 = base64encode(chunk);
  const bytes = new TextEncoder().encode(base64);
  return bytes;
}

export function calculateBase64Length(bytes: number): number {
  return Math.ceil((bytes * 4) / 3);
}

export function base64Transformer(): TransformStream<Uint8Array, Uint8Array> {
  return mapTransformer(
    base64Chunk,
  );
}

export function mapTransformer<T, U>(
  map: (chunk: T) => U | PromiseLike<U>,
): TransformStream<T, U> {
  return toTransformStream(async function* (
    src: ReadableStream<T>,
  ): AsyncGenerator<U> {
    for await (const chunk of src) {
      yield map(chunk);
    }
  });
}
