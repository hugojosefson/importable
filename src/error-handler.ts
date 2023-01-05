function isResponse(err: unknown): err is Response {
  return err instanceof Response;
}

export async function errorHandler(error: unknown): Promise<Response> {
  console.debug(`Handling error:`, error);
  try {
    const possiblyResponse = await error;
    if (isResponse(possiblyResponse)) {
      return possiblyResponse;
    }
  } catch (error) {
    console.error(`Error handling error:`, error);
  }
  return new Response("Internal Server Error", { status: 500 });
}
