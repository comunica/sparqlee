import { DataFactory } from 'rdf-data-factory';
import { Bindings } from '../../../lib/Types';
import { TypeURL } from '../../../lib/util/Consts';
import { bool } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('evaluation of \'bound\' like', () => {
  const DF = new DataFactory();
  const bindings = Bindings({
    '?x': DF.literal('_a', DF.namedNode(TypeURL.XSD_STRING)),
  });
  runTestTable({
    operation: 'BOUND',
    config: { type: 'sync', bindings, config: {}},
    arity: 1,
    aliases: bool,
    notation: Notation.Function,
    testTable: `
    '?x' = true
    '?y' = false
    `,
    errorTable: `
     'apple' = 'Parse error'
    `,
  });
});
