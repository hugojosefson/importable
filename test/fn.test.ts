import { assertEquals } from "@std/assert";
import { add } from "../src/fn.ts";

Deno.test("fn-test", () => {
  Deno.test("add", () => {
    assertEquals(add(1, 2), 3);
  });
});
