import { toTransformStream } from "https://deno.land/std@0.185.0/streams/to_transform_stream.ts";

export const JS_MODULE_PROLOGUE = new TextEncoder().encode(`export default "`);
export const JS_MODULE_EPILOGUE = new TextEncoder().encode(`";`);

export const JS_MODULE_WRAPPER_SIZE = JS_MODULE_PROLOGUE.length +
  JS_MODULE_EPILOGUE.length;

export function jsModuleWrapperTransformStream(): TransformStream<
  Uint8Array,
  Uint8Array
> {
  return toTransformStream(async function* (
    src: ReadableStream<Uint8Array>,
  ): AsyncGenerator<Uint8Array> {
    yield JS_MODULE_PROLOGUE;
    for await (const chunk of src) {
      yield chunk;
    }
    yield JS_MODULE_EPILOGUE;
  });
}
