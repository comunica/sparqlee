import { bool, timeNotation } from '../../../util/Aliases';
import { Notation } from '../../../util/TestTable';
import { runTestTable } from '../../../util/utils';

describe('compare date', () => {
  describe('respect the op:time-equal xpath-functions spec', () => {
    // Originates from: https://www.w3.org/TR/xpath-functions/#func-time-equal
    runTestTable({
      operation: '=',
      arity: 2,
      notation: Notation.Infix,
      aliases: bool,
      testTable: `
        '${timeNotation('08:00:00+09:00')}' '${timeNotation('17:00:00-06:00')}' = false
        '${timeNotation('21:30:00+10:30')}' '${timeNotation('06:00:00-05:00')}' = true
        '${timeNotation('24:00:00+01:00')}' '${timeNotation('00:00:00+01:00')}' = true
      `,
    });
  });

  describe('respect the op:time-less-than xpath-functions spec', () => {
    // Originates from: https://www.w3.org/TR/xpath-functions/#func-time-less-than
    runTestTable({
      operation: '<',
      arity: 2,
      notation: Notation.Infix,
      aliases: bool,
      config: {
        config: {
          defaultTimeZone: { hours: -5, minutes: 0 },
        },
        type: 'sync',
      },
      testTable: `
        '${timeNotation('12:00:00')}' '${timeNotation('23:00:00+06:00')}' = false
        '${timeNotation('11:00:00')}' '${timeNotation('17:00:00Z')}' = true
        '${timeNotation('23:59:59')}' '${timeNotation('24:00:00')}' = false
      `,
    });
  });

  describe('respect the op:date-greater-than xpath-functions spec', () => {
    // Originates from: https://www.w3.org/TR/xpath-functions/#func-time-greater-than
    runTestTable({
      operation: '>',
      arity: 2,
      notation: Notation.Infix,
      aliases: bool,
      testTable: `
        '${timeNotation('08:00:00+09:00')}' '${timeNotation('17:00:00-06:00')}' = false
      `,
    });
  });
});
