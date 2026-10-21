/** Validate transport responses before they enter collaboration state. Never render server HTML. */
export class ApiResponseError extends Error {
  constructor(message: string, public endpoint: string, public status: number, public contentType: string) {
    super(message); this.name = 'ApiResponseError';
  }
}
const mediaType = (response: Response) => (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
const locationDetails = (endpoint: string, response: Response) => `${endpoint} returned HTTP ${response.status} (${mediaType(response) || 'no Content-Type'})`;
const backendHelp = 'Check that this address runs the Smart Reference backend. Use npm run dev, or npm run build followed by npm run preview. A frontend-only host cannot provide shared rooms.';
export async function readApiJson(response: Response, endpoint: string): Promise<Record<string, any>> {
  const type = mediaType(response), details = locationDetails(endpoint, response);
  if (type !== 'application/json' && !/^application\/[\w.+-]+\+json$/.test(type)) {
    await response.body?.cancel();
    throw new ApiResponseError(`${details}, not JSON. ${backendHelp}`, endpoint, response.status, type);
  }
  let result: unknown;
  try { result = await response.json(); }
  catch { throw new ApiResponseError(`${details}, but its JSON response is incomplete or invalid. Retry the action and check the server.`, endpoint, response.status, type); }
  if (!result || typeof result !== 'object' || Array.isArray(result)) throw new ApiResponseError(`${details}, but its response is not a valid API object.`, endpoint, response.status, type);
  const object = result as Record<string, any>;
  if (!response.ok) throw new ApiResponseError(`${typeof object.error === 'string' ? object.error : 'Request failed.'} (${details})`, endpoint, response.status, type);
  return object;
}
export async function requireEventStream(response: Response, endpoint: string) {
  if (!response.ok) { await readApiJson(response, endpoint); return; }
  if (mediaType(response) !== 'text/event-stream' || !response.body) {
    await response.body?.cancel();
    throw new ApiResponseError(`${locationDetails(endpoint, response)}, not a realtime event stream. ${backendHelp}`, endpoint, response.status, mediaType(response));
  }
}
export function parseRoomEvent(data: string, endpoint: string) {
  let room: any;
  try { room = JSON.parse(data); } catch { throw new Error(`Invalid JSON in the realtime stream from ${endpoint}. Reconnecting to recover room state.`); }
  if (!room || typeof room.code !== 'string' || typeof room.documentId !== 'string' || !Number.isInteger(room.revision) || !Array.isArray(room.members) || !Array.isArray(room.references)) {
    throw new Error(`Invalid room snapshot from ${endpoint}. Reconnecting to recover room state.`);
  }
  return room;
}
