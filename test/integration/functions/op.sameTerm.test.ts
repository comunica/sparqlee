import { DataFactory } from 'rdf-data-factory';
import { Bindings } from '../../../lib/Types';
import { TypeURL } from '../../../lib/util/Consts';
import { bool } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('evaluation of \'sameTerm\' like', () => {
  const DF = new DataFactory();
  const bindings = Bindings({
    '?a': DF.literal('apple', DF.namedNode(TypeURL.XSD_STRING)),
    '?b': DF.literal('apple', DF.namedNode(TypeURL.XSD_STRING)),
    '?c': DF.literal('apple', DF.namedNode(TypeURL.XSD_ANY_URI)),
    '?d': DF.literal('Apple', DF.namedNode(TypeURL.XSD_STRING)),
    '?e': DF.literal('pear', DF.namedNode(TypeURL.XSD_STRING)),
  });
  runTestTable({
    operation: 'sameTerm',
    config: { type: 'sync', bindings, config: {}},
    arity: 2,
    aliases: bool,
    notation: Notation.Function,
    testTable: `
    ?a ?a = true
    ?a ?b = true
    ?a ?c = false
    ?a ?d : false
    ?a ?e = false
    ?c ?d = false
    `,
  });
});
