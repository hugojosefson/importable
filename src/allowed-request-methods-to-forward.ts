export const ALLOWED_REQUEST_METHODS_TO_FORWARD = ["GET", "HEAD"];

export function isMethodAllowed(requestMethod: string): boolean {
  return ALLOWED_REQUEST_METHODS_TO_FORWARD.includes(
    requestMethod.toUpperCase(),
  );
}

export function getValidRequestedMethodOrThrow(request: Request): string {
  const requestedMethod = request.method;
  if (!isMethodAllowed(requestedMethod)) {
    console.error(
      `Requested method not allowed: ${requestedMethod} (for ${request.url})`,
    );
    throw new Response("Method not allowed", {
      status: 405,
      headers: { "Allow": ALLOWED_REQUEST_METHODS_TO_FORWARD.join(", ") },
    });
  }
  return requestedMethod;
}
