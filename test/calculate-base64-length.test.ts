import { assertEquals } from "@std/assert";
import {
  base64Chunk,
  calculateBase64Length,
} from "../src/stream/binary-data-to-base64-transformer.ts";

Deno.test("calculateBase64Length", () => {
  const str = "Hello, World!";
  const bytes = new TextEncoder().encode(str);
  const base64bytes = base64Chunk(bytes);
  const actual = calculateBase64Length(
    bytes.length,
  );
  const expected = base64bytes.length;
  assertEquals(actual, expected);
});
