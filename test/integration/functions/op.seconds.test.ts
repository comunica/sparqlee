import { int, timeNotation } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('evaluation of \'SECONDS\'', () => {
  runTestTable({
    arity: 1,
    notation: Notation.Function,
    operation: 'SECONDS',
    testTable: `
    '${timeNotation('11:28:01Z')}' = '${int('1')}'
    '${timeNotation('15:38:02-08:00')}' = '${int('2')}'
    '${timeNotation('23:59:00Z')}' = '${int('0')}'
    '${timeNotation('01:02:03')}' = '${int('3')}'
  `,
  });
});
