const decoder = new TextDecoder();
const encoder = new TextEncoder();

export class BinaryDataToBase64Transformer extends TransformStream<
  BufferSource,
  Uint8Array
> {
  constructor() {
    super({
      transform: (chunk, controller) => {
        const base64 = btoa(decoder.decode(chunk));
        const bytes = encoder.encode(base64);
        controller.enqueue(bytes);
      },
    });
  }
}
