import { add } from "../fn.ts";

const encoder = new TextEncoder();
export const JS_MODULE_PROLOGUE = encoder.encode(`export default "`);
export const JS_MODULE_EPILOGUE = encoder.encode(`";`);

export const JS_MODULE_WRAPPER_SIZE = [
  JS_MODULE_PROLOGUE.length,
  JS_MODULE_EPILOGUE.length,
].reduce(add);

export class JsModuleWrapperTransformStream
  extends TransformStream<Uint8Array, Uint8Array> {
  private prologueRead = false;
  private epilogueRead = false;

  constructor() {
    super({
      transform: (chunk, controller) => {
        if (!this.prologueRead) {
          this.prologueRead = true;
          controller.enqueue(JS_MODULE_PROLOGUE);
          return;
        }
        if (this.epilogueRead) {
          return;
        }
        controller.enqueue(chunk);
      },
      flush: (controller) => {
        if (!this.epilogueRead) {
          this.epilogueRead = true;
          controller.enqueue(JS_MODULE_EPILOGUE);
        }
      },
    });
  }
}
