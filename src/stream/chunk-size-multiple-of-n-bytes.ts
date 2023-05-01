import { toTransformStream } from "https://deno.land/std@0.185.0/streams/to_transform_stream.ts";

/**
 * A pass-through TransformStream that makes sure all output chunks are a multiple of n bytes. Except the last chunk.
 * @param desiredChunkSizeMultiple
 */
export function chunkSizeMultiplesOfNBytesTransformer(
  desiredChunkSizeMultiple: number,
): TransformStream<Uint8Array, Uint8Array> {
  return toTransformStream(
    async function* (
      src: ReadableStream<Uint8Array>,
    ): AsyncGenerator<Uint8Array> {
      let remainder: Uint8Array | undefined;
      for await (let chunk of src) {
        if (remainder) {
          const combined = new Uint8Array(
            remainder.length + chunk.length,
          );
          combined.set(remainder);
          combined.set(chunk, remainder.length);
          chunk = combined;
        }
        const remainderLength = chunk.length % desiredChunkSizeMultiple;
        if (remainderLength) {
          remainder = chunk.slice(
            chunk.length - remainderLength,
            chunk.length,
          );
          chunk = chunk.slice(0, chunk.length - remainderLength);
        } else {
          remainder = undefined;
        }
        yield chunk;
      }
      if (remainder) {
        yield remainder;
      }
    },
  );
}
