import { DataFactory } from 'rdf-data-factory';
import type { SyncEvaluatorConfig } from '../../lib/evaluators/SyncEvaluator';
import { testAll } from '../util/utils';

const DF = new DataFactory();

describe('evaluations of \'bnode\' with custom blank node generator function', () => {
  const config: SyncEvaluatorConfig = {
    bnode: (input?: string) => DF.blankNode(`${input || 'b'}cd`),
  };
  testAll([
    'BNODE() = _:bcd',
    'BNODE("hello") = _:hellocd',
  ], { type: 'sync', config });
});
