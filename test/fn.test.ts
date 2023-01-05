import { assertEquals } from "https://deno.land/std@0.170.0/testing/asserts.ts";
import { add } from "../src/fn.ts";

Deno.test("fn-test", () => {
  Deno.test("add", () => {
    assertEquals(add(1, 2), 3);
  });
});
