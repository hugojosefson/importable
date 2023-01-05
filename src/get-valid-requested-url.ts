import { ALLOWED_HOSTS } from "./allowed-hosts.ts";

function isAllowedHost(host: string): boolean {
  return ALLOWED_HOSTS.includes(host);
}

function isAllowedProtocol(protocol: string): boolean {
  return protocol === "https:";
}

function validateRequestedUrl(url: URL): void {
  if (!isAllowedProtocol(url.protocol)) {
    throw new Response("Not allowed", { status: 403 });
  }

  if (!isAllowedHost(url.host)) {
    throw new Response("Not allowed", { status: 403 });
  }
}

export function getValidRequestedUrl(request: Request): URL {
  const url = new URL(request.url);
  const pathname = url.pathname.slice(1);
  const search = url.search;

  const requestedUrlString = [pathname, search].join("");

  const requestedUrl = new URL(requestedUrlString);
  validateRequestedUrl(requestedUrl);
  return requestedUrl;
}
