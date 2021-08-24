import type * as RDF from '@rdfjs/types';
import type { Event } from 'benchmark';
import { Suite } from 'benchmark';
import { DataFactory } from 'rdf-data-factory';
import { translate } from 'sparqlalgebrajs';
import { AsyncEvaluator } from '../lib/evaluators/AsyncEvaluator';
import { Bindings } from '../lib/Types';
import { TypeURL } from '../lib/util/Consts';
import { template } from '../test/util/Aliases';

const benchSuite = new Suite();
const DF = new DataFactory();

function integerTerm(int: number): RDF.Term {
  return DF.literal(int.toString(), DF.namedNode(TypeURL.XSD_INTEGER));
}

benchSuite.add('bench addition', async() => {
  const query = translate(template('?a + ?b = ?c'));
  const evaluator = new AsyncEvaluator(query.input.expression);
  const max = 100;
  for (let fst = 0; fst < max; fst++) {
    for (let snd = 0; snd < max; snd++) {
      await evaluator.evaluate(Bindings({
        '?a': integerTerm(fst),
        '?b': integerTerm(snd),
        '?c': integerTerm(fst + snd),
      }));
    }
  }
}).on('cycle', (event: Event) => {
  // eslint-disable-next-line no-console
  console.log(String(event.target));
}).run();

