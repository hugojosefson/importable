import { ALLOWED_HOSTS } from "./allowed-hosts.ts";

function isAllowedHost(host: string): boolean {
  return ALLOWED_HOSTS.includes(host);
}

function isAllowedProtocol(protocol: string): boolean {
  return protocol === "https:";
}

function validateRequestedUrlOrThrow(url: URL): void {
  if (!isAllowedProtocol(url.protocol)) {
    console.error(
      `Requested protocol not allowed: ${url.protocol} (for ${url})`,
    );
    throw new Response("Not allowed", { status: 403 });
  }

  if (!isAllowedHost(url.host)) {
    console.error(`Requested host not allowed: ${url.host} (for ${url})`);
    throw new Response("Not allowed", { status: 403 });
  }
}

export function getValidRequestedUrlOrThrow(request: Request): URL {
  const url = new URL(request.url);
  const pathname = url.pathname.slice(1);
  const search = url.search;

  const requestedUrlString = [pathname, search].join("");

  const requestedUrl = new URL(requestedUrlString);
  validateRequestedUrlOrThrow(requestedUrl);
  return requestedUrl;
}

export function getOurBaseUrl(request: Request): URL {
  return new URL(new URL(request.url).origin);
}
