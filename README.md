# importable

Makes fetchable urls, importable.

## Usage

If you want to use a `.wasm` file, you can normally not `import` it directly,
but have to use `fetch()` at runtime. This causes it to not be part of the
static import structure, and not cached along with other `import`:ed modules.

Instead, you can prepend `https://importable.deno.land/` to the `.wasm` file's
URL, and the `.wasm` file's binary contents will be converted to a `default`
export of a base64 string. Then you can import that.

### Example

Instead of:

```ts
const wasmBytes = await fetch("https://esm.sh/yoga-wasm-web/dist/yoga.wasm")
  .then((r) => r.arrayBuffer());
```

...which will not be cached along with other imports, and will be fetched at
runtime,

You can now instead do:

```ts
import base64String, {
  toUint8Array,
} from "https://importable.deno.land/https://esm.sh/yoga-wasm-web/dist/yoga.wasm";

const wasmBytes = toUint8Array(base64String);
```

...which will be part of the static import structure, and cached along with
other imports.

### Allowed URLs

The URL must be a valid `https` URL, and from one of the following domains:

- [`https://esm.sh`](https://esm.sh)
- [`https://cdn.skypack.dev`](https://cdn.skypack.dev)
- [`https://unpkg.com`](https://unpkg.com)
- [`https://jspm.dev`](https://jspm.dev)
- [`https://cdn.jsdelivr.net`](https://cdn.jsdelivr.net)
- [`https://deno.land`](https://deno.land)
- [`https://raw.githubusercontent.com`](https://raw.githubusercontent.com)

## License

MIT
