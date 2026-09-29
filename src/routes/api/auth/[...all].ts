import { toSolidStartHandler } from 'better-auth/solid-start';
import getAuth from '../../../server/better-auth';

/** Better Auth's routes, at the server's `AUTH_PATH`: sign-in, callbacks, sessions and `/token` */
type Handler = (event: { request: Request }) => Promise<Response>;

const handlers = (): ReturnType<typeof toSolidStartHandler> => toSolidStartHandler(getAuth());

export const GET: Handler = async (event) => handlers().GET(event);
export const POST: Handler = async (event) => handlers().POST(event);
