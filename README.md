# importable

Makes fetchable urls, importable.

## Background

If you want to use a `.wasm` file, you can normally not `import` it directly,
but have to use `fetch()` at runtime. This causes it to not be part of the
static import structure, and not cached along with other `import`:ed modules.

## Usage

Prepend [https://importable.deno.dev/](https://importable.deno.dev/) to a file's
URL, and the file's (possibly binary) contents will be converted to a `default`
export of a base64 string. Then you can import that.

### Example

Instead of:

```ts
// don't do this
const response = await fetch("https://unpkg.com/yoga-wasm-web/dist/yoga.wasm", {
  redirect: "follow",
});
export const wasmBytes = new Uint8Array(await response.arrayBuffer());
```

...which will not be cached along with other imports, and will be fetched every
time at runtime,

You can now instead do:

```ts
// do this
import base64String from "https://importable.deno.dev/https://unpkg.com/yoga-wasm-web/dist/yoga.wasm";
import { decode } from "https://deno.land/std/encoding/base64.ts";

export const wasmBytes: Uint8Array = decode(base64String);
```

...which will be part of the static import structure, and cached along with
other imports.

### Allowed URLs

The URL must be a valid `https` URL, and from one of the hosts listed in
[src/allowed-hosts.ts](src/allowed-hosts.ts).

## Source code, License

| Source code | [github.com/hugojosefson/importable](https://github.com/hugojosefson/importable) |
| ----------- | -------------------------------------------------------------------------------- |
| License     | MIT                                                                              |
