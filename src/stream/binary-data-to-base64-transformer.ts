const encoder = new TextEncoder();
export const binaryDataToBase64Transformer: Transformer<
  BufferSource,
  Uint8Array
> = {
  transform(chunk, controller) {
    const base64 = btoa(new TextDecoder().decode(chunk));
    const bytes = encoder.encode(base64);
    controller.enqueue(bytes);
  },
};
