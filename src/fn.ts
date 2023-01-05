export type Entry = [string, string];
export type Entries = Entry[];
export type Headersish = Headers | Entries | Record<string, string>;

export function headersToEntries(headers?: Headersish): Entries {
  if (!headers) {
    return [];
  }
  if (headers instanceof Headers) {
    return Array.from(headers.entries());
  }
  if (Array.isArray(headers)) {
    return headers;
  }
  return Object.entries(headers);
}

/**
 * Filter headers to only include the ones we want. Optionally add some.
 * @param headers Headers to filter
 * @param allowed List of allowed headers, lower-cased
 * @param additionalHeaders Any additional headers to add
 */
export function filterHeaders(
  headers: Headersish,
  allowed: string[],
  additionalHeaders?: Headersish,
): Headers {
  const predicate = ([key]: Entry) => allowed.includes(key.toLowerCase());
  const headersToKeep = headersToEntries(headers).filter(predicate);
  return new Headers([
    ...headersToKeep,
    ...headersToEntries(additionalHeaders),
  ]);
}

export function prependString(prefix: string): (s: string) => string {
  return (s) => prefix + s;
}

export function indent(indent: number, text: string | string[]): string {
  const lines = Array.isArray(text) ? text : text.split("\n");
  const prependIndent = prependString(" ".repeat(indent));
  return lines.map(prependIndent).join("\n");
}
