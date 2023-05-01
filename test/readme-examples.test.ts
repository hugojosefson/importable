import { run } from "https://deno.land/x/run_simple@2.0.0/mod.ts";
import {
  Token,
  tokens,
} from "https://deno.land/x/rusty_markdown@v0.4.1/mod.ts";
import { assertEquals } from "https://deno.land/std@0.185.0/testing/asserts.ts";
import { ALLOWED_HOSTS } from "../src/allowed-hosts.ts";

const README_MD = await Deno.readTextFile(
  new URL("../README.md", import.meta.url),
);
const tokenized = tokens(README_MD);

type CodeBlock = {
  type: "start" | "end";
  tag: "codeBlock";
  kind: "fenced";
  language: string;
};

function isTypeScript(token: Token) {
  if (isCodeBlock(token)) {
    const codeBlock = token;
    return ["typescript", "ts"].includes(codeBlock.language);
  }
  return false;
}

function isCodeBlock(token: Token): token is CodeBlock {
  return (token.type === "start" || token.type === "end") &&
    token.tag === "codeBlock" && token.kind === "fenced" &&
    typeof token.language === "string";
}

const codeSnippets: string[] = [];
let inCodeSnippet = false;
for (const token of tokenized) {
  if (
    token.type === "start" && token.tag === "codeBlock" && isTypeScript(token)
  ) {
    inCodeSnippet = true;
    continue;
  }
  if (token.type === "end" && token.tag === "codeBlock") {
    inCodeSnippet = false;
    continue;
  }
  if (inCodeSnippet && token.type === "text") {
    codeSnippets.push(
      token.content.replace(
        "https://importable.deno.dev",
        "http://localhost:8080",
      ),
    );
  }
}

Deno.test("there are 2 typescript code snippets", () => {
  assertEquals(codeSnippets.length, 2);
});

Deno.test("README code snippets are valid TypeScript and run without error in an external deno process", async () => {
  for (const codeSnippet of codeSnippets) {
    await runSnippetInExternalProcess(codeSnippet);
  }
});

async function runWithCodeSnippetInTempFile<T>(
  codeSnippet: string,
  callback: (tempFile: string) => T | Promise<T>,
): Promise<T> {
  const tempFile = await Deno.makeTempFile({ suffix: ".ts" });
  try {
    await Deno.writeTextFile(tempFile, codeSnippet);
    return await callback(tempFile);
  } finally {
    await Deno.remove(tempFile);
  }
}

async function runSnippetInExternalProcess(snippet: string) {
  await runWithCodeSnippetInTempFile(snippet, async (tempFile) => {
    return await run([
      "deno",
      "run",
      `--allow-net=${ALLOWED_HOSTS.join(",")}`,
      tempFile,
    ]);
  });
}

function assertNotUndefined(something: unknown): void {
  if (something === undefined) {
    throw new Error("Expected something to not be undefined");
  }
  console.debug("assertNotUndefined", something);
}

function assertNotEmptyModule(something: unknown): void {
  assertNotUndefined(something);
  const module = something as Record<string, unknown>;
  if (Object.keys(module).length === 0) {
    throw new Error("Expected module to have at least one key");
  }
  if (Object.values(module).every((value) => value === undefined)) {
    throw new Error("Expected at least one module value to not be undefined");
  }
  console.debug("assertNotEmptyModule", something);
}

Deno.test("README code snippets are valid TypeScript and export the same things (not undefined!), using async import() to check the snippets", async () => {
  const results = await Promise.all(
    codeSnippets.map(async (codeSnippet) => {
      return await runWithCodeSnippetInTempFile(
        codeSnippet,
        (tempFile) => import(`file://${tempFile}`),
      );
    }),
  );
  const firstResult = results[0];
  assertNotEmptyModule(firstResult);
  for (const result of results) {
    assertEquals(result, firstResult);
  }
});
