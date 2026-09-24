import { farmdbFetcher } from "@farmdb/api-client/data/fetchers/fetcher";

export type FarmdbWriteMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export interface FarmdbWriteRequest<RequestBody = unknown> {
  path: string;
  method: FarmdbWriteMethod;
  body?: RequestBody;
}

/**
 * Sends a create, update or delete to the FarmDB API through the single
 * fetcher. A plain function, so forms, event handlers and stores can call it.
 */
export function farmdbMutate<ResponseBody = unknown, RequestBody = unknown>(
  writeRequest: FarmdbWriteRequest<RequestBody>,
  accessToken: string,
): Promise<ResponseBody> {
  const options: RequestInit = {
    method: writeRequest.method,
    body: JSON.stringify(writeRequest.body),
  };
  return farmdbFetcher<ResponseBody>([writeRequest.path, options, accessToken]);
}
