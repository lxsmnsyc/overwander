// Typed by hand: inferring a tuple type for every row of every region
// would slow the checker for nothing, and the rows are checked against
// the source by test/data/species-compact.test.ts
declare module '*.records.json' {
  import type { RecordFile } from '../src/data/species/compact';

  const rows: RecordFile;
  export default rows;
}

declare module '*.learnsets.json' {
  import type { LearnSetFile } from '../src/data/species/compact';

  const rows: LearnSetFile;
  export default rows;
}
