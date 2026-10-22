import { type Node, isAlias, isMap, isScalar, isSeq, parseDocument } from 'yaml';

/**
 * A YAML data file as TypeScript sees it: the same value written out
 * as JSON, so an import is typed the way a JSON import is, with every
 * key and value mapped back to where the YAML wrote it.
 *
 * The value is what `scripts/vite/yaml.ts` hands the build, since both
 * parse with the same library and the same defaults
 */

/** `[virtualStart, virtualLength, originalStart, originalLength, kind]`, in UTF-16 units */
export type SpanMapping = [number, number, number, number, number];

export interface MapperDiagnostic {
  messageText: string;
  start: number;
  length: number;
  code: number;
}

export interface Mapped {
  text: string;
  mappings: SpanMapping[];
  diagnostics: MapperDiagnostic[];
}

/** The JSON text differs from the YAML it stands for, so every span is an atom */
const ATOM = 1;

/** Ours alone, so a YAML error never reads as one of TypeScript's */
const PARSE_ERROR = 99001;
const NOT_JSON = 99002;

export default function transformYaml(content: string): Mapped {
  const doc = parseDocument(content);
  const mappings: SpanMapping[] = [];
  const diagnostics: MapperDiagnostic[] = [];
  let text = '';

  for (const error of doc.errors) {
    // An error at the end of the file is placed past its last character,
    // which TypeScript refuses as a range
    const end = Math.min(error.pos[1], content.length);
    const start = Math.min(error.pos[0], Math.max(end - 1, 0));

    diagnostics.push({
      messageText: error.message.split('\n')[0].replace(/ at line \d+, column \d+:?$/, ''),
      start,
      length: end - start,
      code: PARSE_ERROR,
    });
  }
  if (diagnostics.length > 0) {
    return { text: 'null', mappings, diagnostics };
  }

  const write = (piece: string, node?: Node | null): void => {
    const range = node?.range;

    if (range != null) {
      mappings.push([text.length, piece.length, range[0], range[1] - range[0], ATOM]);
    }
    text += piece;
  };

  const emit = (node: unknown): void => {
    if (isAlias(node)) {
      // The anchored value is written again in full, mapped to where the anchor is
      emit(node.resolve(doc));
    } else if (isScalar(node)) {
      const value = node.value;

      if (typeof value === 'number' && !Number.isFinite(value)) {
        const range = node.range ?? [0, 1];

        diagnostics.push({
          messageText: `${String(value)} has no JSON form, so the import cannot be typed`,
          start: range[0],
          length: Math.max(range[1] - range[0], 1),
          code: NOT_JSON,
        });
        write('null', node);
      } else {
        write(JSON.stringify(value ?? null), node);
      }
    } else if (isMap(node)) {
      text += '{';
      for (const [at, pair] of node.items.entries()) {
        if (at > 0) {
          text += ',';
        }

        const key = pair.key;

        write(JSON.stringify(String(isScalar(key) ? key.value : key)), isScalar(key) ? key : null);
        text += ':';
        emit(pair.value);
      }
      text += '}';
    } else if (isSeq(node)) {
      text += '[';
      for (const [at, item] of node.items.entries()) {
        if (at > 0) {
          text += ',';
        }
        emit(item);
      }
      text += ']';
    } else {
      // An empty document, or a key written with no value
      text += 'null';
    }
  };

  emit(doc.contents);
  return { text, mappings, diagnostics };
}
