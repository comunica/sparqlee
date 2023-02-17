import { dateNotation, int } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('evaluation of \'MONTH\'', () => {
  runTestTable({
    arity: 1,
    notation: Notation.Function,
    operation: 'MONTH',
    testTable: `
    '${dateNotation('2010-06-21Z')}' = '${int('6')}'
    '${dateNotation('2010-12-21-08:00')}' = '${int('12')}'
    '${dateNotation('2008-06-20Z')}' = '${int('6')}'
    '${dateNotation('2011-02-01')}' = '${int('2')}'
  `,
  });
});
