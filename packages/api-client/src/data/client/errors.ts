const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";
const UNREACHABLE_MESSAGE = "Could not reach the server. Check your connection and try again.";
const NO_RESPONSE_STATUS = 0;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiResult<ResponseBody> {
  data?: ResponseBody;
  error?: unknown;
  response: Response;
}

function detailText(body: unknown): string | null {
  const hasDetail = typeof body === "object" && body !== null && "detail" in body;
  if (!hasDetail || typeof body.detail !== "string" || body.detail.length === 0) return null;
  return body.detail;
}

/** Server faults never pass their text on; client errors only a plain-text detail. */
function safeErrorMessage(status: number, body: unknown): string {
  const isServerFault = status >= 500;
  if (isServerFault) return GENERIC_ERROR_MESSAGE;
  return detailText(body) ?? GENERIC_ERROR_MESSAGE;
}

function isUnreachable(failure: unknown): boolean {
  const timedOut = failure instanceof DOMException && failure.name === "TimeoutError";
  return failure instanceof TypeError || timedOut;
}

export async function unwrap<ResponseBody>(
  request: Promise<ApiResult<ResponseBody>>,
): Promise<ResponseBody> {
  let result: ApiResult<ResponseBody>;
  try {
    result = await request;
  } catch (failure) {
    if (isUnreachable(failure)) throw new ApiError(UNREACHABLE_MESSAGE, NO_RESPONSE_STATUS);
    throw failure;
  }

  const { data, error, response } = result;
  if (!response.ok || error !== undefined) {
    throw new ApiError(safeErrorMessage(response.status, error), response.status);
  }
  return data as ResponseBody;
}
