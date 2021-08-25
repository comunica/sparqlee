import { bool } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('evaluation of \'bound\' like', () => {
  // Tests from examples in spec: https://www.w3.org/TR/sparql11-query/#func-in
  runTestTable({
    aliases: bool,
    notation: Notation.Infix,
    operation: 'IN',
    arity: 2,
    testTable: `
      2 '(1, 2, 3)' = true
      2 '()' = false
      2 '(<http://example/iri>, "str", 2.0)' = true
      2 '(1/0, 2)' = true
      2 '(2, 1/0)' = true
    `,
    errorTable: `
      2 '(3, 1/0)' = 'Some argument to IN errorred and none where equal'
    `,
  });
});
