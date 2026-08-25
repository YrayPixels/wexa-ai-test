export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly code: string = "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status },
    );
  }

  const message =
    error instanceof Error ? error.message : "Unexpected server error";

  const isDb =
    /Neo4j|Bolt|ECONNREFUSED|authentication|ServiceUnavailable|Failed to connect/i.test(
      message,
    );

  if (isDb) {
    return Response.json(
      {
        error:
          "Unable to connect to TRACE. The graph database is currently unavailable.",
        code: "DATABASE_UNAVAILABLE",
      },
      { status: 503 },
    );
  }

  console.error(error);
  return Response.json(
    { error: "Something went wrong while processing this request.", code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}
