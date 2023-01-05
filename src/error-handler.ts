function isResponse(err: unknown): err is Response {
  return err instanceof Response;
}

export async function errorHandler(error: unknown): Promise<Response> {
  const possiblyResponse = await error;
  if (isResponse(possiblyResponse)) {
    return possiblyResponse;
  }

  console.error(error);
  return new Response("Internal Server Error", { status: 500 });
}
