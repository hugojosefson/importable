export const RESPONSE_HEADERS_TO_FORWARD: string[] = [
  "content-type",
  "cache-control",
  "etag",
  "last-modified",
  "expires",
  "date",
];
export const RESPONSE_HEADERS_TO_FORWARD_ON_ERROR: string[] = [
  ...RESPONSE_HEADERS_TO_FORWARD,
  "content-length",
  "content-encoding",
  "content-type",
];
