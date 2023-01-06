export const README_HTML = await Deno.readTextFile(
  new URL("../README.html", import.meta.url).pathname,
);
