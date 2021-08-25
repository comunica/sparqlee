import { TypeURL } from '../../../lib/util/Consts';
import { bool, merge, numeric } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

// TODO: PR why does this test not run over the unary plus operator?
describe.skip('evaluation of \'unaryPlus\' like', () => {
  // This last test regards the comment in the specs: https://www.w3.org/TR/xpath-functions/#func-numeric-unary-plus
  // > The returned value is equal to $arg, and is an instance of xs:integer, xs:decimal, xs:double, or xs:float
  // > depending on the type of $arg.
  runTestTable({
    aliases: merge(bool, numeric),
    notation: Notation.Prefix,
    operation: '+',
    arity: 1,
    testTable: `
      0i = 0i
      -6i = -6i
      6i = 6i
      '"-6"^^<${TypeURL.XSD_NEGATIVE_INTEGER}>' = -6i
    `,
  });
});
