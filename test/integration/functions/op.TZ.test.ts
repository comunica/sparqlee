import { dateNotation, timeNotation } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('evaluation of \'TZ\'', () => {
  runTestTable({
    arity: 1,
    notation: Notation.Function,
    operation: 'TZ',
    testTable: `
    '${dateNotation('2010-06-21Z')}' = "Z"
    '${dateNotation('2010-12-21-08:00')}' = "-08:00"
    '${dateNotation('2008-06-20Z')}' = "Z"
    '${dateNotation('2011-02-01')}' = ""
    
    '${timeNotation('11:28:01Z')}' = "Z"
    '${timeNotation('15:38:02-08:00')}' = "-08:00"
    '${timeNotation('23:59:00Z')}' = "Z"
    '${timeNotation('01:02:03')}' = ""
  `,
  });
});
