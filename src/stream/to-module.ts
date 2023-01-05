const encoder = new TextEncoder();
export const JS_MODULE_PROLOGUE = encoder.encode(`export default "`);
export const JS_MODULE_EPILOGUE = encoder.encode(`";`);
export const JS_MODULE_WRAPPER_SIZE = JS_MODULE_PROLOGUE.length +
  JS_MODULE_EPILOGUE.length;

export function wrapInJsModule(
  readableStream: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const reader = readableStream.getReader();
  let prologueRead = false;
  let epilogueRead = false;

  return new ReadableStream({
    async pull(controller) {
      if (!prologueRead) {
        prologueRead = true;
        controller.enqueue(JS_MODULE_PROLOGUE);
        return;
      }
      if (epilogueRead) {
        return controller.close();
      }
      const { done, value } = await reader.read();
      if (done) {
        epilogueRead = true;
        controller.enqueue(JS_MODULE_EPILOGUE);
        return controller.close();
      }
      controller.enqueue(value);
    },
    cancel() {
      reader.cancel();
    },
  });
}
