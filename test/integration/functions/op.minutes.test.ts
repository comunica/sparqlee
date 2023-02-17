import { int, timeNotation } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('evaluation of \'MINUTES\'', () => {
  runTestTable({
    arity: 1,
    notation: Notation.Function,
    operation: 'MINUTES',
    testTable: `
    '${timeNotation('11:28:01Z')}' = '${int('28')}'
    '${timeNotation('15:38:02-08:00')}' = '${int('38')}'
    '${timeNotation('23:59:00Z')}' = '${int('59')}'
    '${timeNotation('01:02:03')}' = '${int('2')}'
  `,
  });
});
