export const ALLOWED_REQUEST_METHODS_TO_FORWARD = ["GET", "HEAD"];

export function isMethodAllowed(requestMethod: string): boolean {
  return ALLOWED_REQUEST_METHODS_TO_FORWARD.includes(
    requestMethod.toUpperCase(),
  );
}

export function getValidRequestedMethodOrThrow(request: Request): string {
  const requestedMethod = request.method;
  if (!isMethodAllowed(requestedMethod)) {
    throw new Response("Not allowed", { status: 403 });
  }
  return requestedMethod;
}
