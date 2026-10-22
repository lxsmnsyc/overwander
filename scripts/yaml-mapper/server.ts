import * as v from 'valibot';
import transformYaml from './transform.ts';

/**
 * The content mapper TypeScript 7.1 spawns for `.yaml` imports. It
 * speaks JSON-RPC over stdio with LSP framing (`Content-Length`
 * headers), and only ever answers: TypeScript sends every request.
 * https://github.com/microsoft/typescript-go/pull/4712
 */

const REQUEST = v.looseObject({
  id: v.optional(v.union([v.number(), v.string()])),
  method: v.string(),
  params: v.optional(v.looseObject({ content: v.optional(v.string()) })),
});

type Request = v.InferOutput<typeof REQUEST>;

function send(message: object): void {
  const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', ...message }), 'utf8');

  process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
  process.stdout.write(body);
}

function answer(request: Request): unknown {
  switch (request.method) {
    case 'initialize':
      // YAML offsets come out of the parser as string indices, which are UTF-16
      return { positionEncoding: 'utf-16', diagnosticSource: 'yaml' };
    case 'openProject':
      return {};
    case 'closeProject':
      return null;
    case 'transform': {
      const { text, mappings, diagnostics } = transformYaml(request.params?.content ?? '');

      return { text, extension: '.json', mappings, diagnostics };
    }
    default:
      throw new Error(`Unknown method ${request.method}`);
  }
}

function handle(request: Request): void {
  if (request.id == null) {
    return;
  }
  try {
    send({ id: request.id, result: answer(request) });
  } catch (error) {
    send({ id: request.id, error: { code: -32603, message: String(error) } });
  }
}

let pending = Buffer.alloc(0);

process.stdin.on('data', (chunk: Buffer) => {
  pending = Buffer.concat([pending, chunk]);

  for (;;) {
    const split = pending.indexOf('\r\n\r\n');

    if (split === -1) {
      return;
    }

    const length = /Content-Length: *(\d+)/i.exec(pending.subarray(0, split).toString('ascii'));

    if (length == null) {
      throw new Error('A message arrived without a Content-Length header');
    }

    const end = split + 4 + Number(length[1]);

    if (pending.length < end) {
      return;
    }

    const body = pending.subarray(split + 4, end).toString('utf8');

    pending = pending.subarray(end);
    handle(v.parse(REQUEST, JSON.parse(body)));
  }
});
