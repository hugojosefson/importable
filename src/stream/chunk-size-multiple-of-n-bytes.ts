export class ChunkSizeMultiplesOfNBytesTransformer
  extends TransformStream<Uint8Array, Uint8Array> {
  constructor(private desiredChunkSize: number) {
    super({
      transform: (chunk, controller) => {
        const remainder = chunk.length % this.desiredChunkSize;
        if (remainder === 0) {
          controller.enqueue(chunk);
          return;
        }
        const chunkSize = chunk.length - remainder;
        controller.enqueue(chunk.slice(0, chunkSize));
      },
    });
  }
}
