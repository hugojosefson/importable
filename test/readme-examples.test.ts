import {
  Token,
  tokens,
} from "https://deno.land/x/rusty_markdown@v0.4.1/mod.ts";
import { assertEquals } from "https://deno.land/std@0.170.0/testing/asserts.ts";
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
  if (!isCodeBlock(token)) {
    return false;
  }
  const codeBlock = token;
  return ["typescript", "ts"].includes(codeBlock.language);
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

Deno.test("README code snippets are valid TypeScript and run without error", async () => {
  for (const codeSnippet of codeSnippets) {
    await runSnippet(codeSnippet);
  }
});

async function runSnippet(snippet: string) {
  const tempFile = await Deno.makeTempFile({ suffix: ".ts" });
  try {
    await Deno.writeTextFile(tempFile, snippet);
    const process = Deno.run({
      cmd: [
        "deno",
        "run",
        `--allow-net=${ALLOWED_HOSTS.join(",")}`,
        tempFile,
      ],
      stdout: "piped",
      stderr: "piped",
    });
    const { code } = await process.status();
    const stdout = await process.output();
    const stderr = await process.stderrOutput();
    if (code !== 0) {
      throw new Error(`deno run failed with code ${code}:
stdout: ${new TextDecoder().decode(stdout)}
stderr: ${new TextDecoder().decode(stderr)}`);
    }
    process.close();
  } finally {
    await Deno.remove(tempFile);
  }
}
