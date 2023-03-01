import { bool, timeTyped } from '../../../util/Aliases';
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
        '${timeTyped('08:00:00+09:00')}' '${timeTyped('17:00:00-06:00')}' = false
        '${timeTyped('21:30:00+10:30')}' '${timeTyped('06:00:00-05:00')}' = true
        '${timeTyped('24:00:00+01:00')}' '${timeTyped('00:00:00+01:00')}' = true
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
        '${timeTyped('12:00:00')}' '${timeTyped('23:00:00+06:00')}' = false
        '${timeTyped('11:00:00')}' '${timeTyped('17:00:00Z')}' = true
        '${timeTyped('23:59:59')}' '${timeTyped('24:00:00')}' = false
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
        '${timeTyped('08:00:00+09:00')}' '${timeTyped('17:00:00-06:00')}' = false
      `,
    });
  });
});
