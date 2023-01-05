export function getDesiredChunkSizeTransformer(
  desiredChunkSize: number,
): Transformer<Uint8Array, Uint8Array> {
  return {
    transform(chunk, controller) {
      const remainder = chunk.length % desiredChunkSize;
      if (remainder === 0) {
        controller.enqueue(chunk);
        return;
      }
      const chunkSize = chunk.length - remainder;
      controller.enqueue(chunk.slice(0, chunkSize));
    },
  };
}
