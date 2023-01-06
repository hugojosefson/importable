export const README_HTML = await Deno.readTextFile(
  new URL("../README.html", import.meta.url).pathname,
);

export const README_HTML_LENGTH = README_HTML.length;
