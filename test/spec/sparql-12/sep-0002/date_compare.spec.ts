import { bool, dateNotation } from '../../../util/Aliases';
import { Notation } from '../../../util/TestTable';
import { runTestTable } from '../../../util/utils';

describe('compare date', () => {
  describe('respect the op:date-equal xpath-functions spec', () => {
    // Originates from: https://www.w3.org/TR/xpath-functions/#func-date-equal
    runTestTable({
      operation: '=',
      arity: 2,
      notation: Notation.Infix,
      aliases: bool,
      testTable: `
        '${dateNotation('2004-12-25Z')}' '${dateNotation('2004-12-25+07:00')}' = false
        '${dateNotation('2004-12-25-12:00')}' '${dateNotation('2004-12-26+12:00')}' = true
      `,
    });
  });

  describe('respect the op:date-less-than xpath-functions spec', () => {
    // Originates from: https://www.w3.org/TR/xpath-functions/#func-date-less-than
    runTestTable({
      operation: '<',
      arity: 2,
      notation: Notation.Infix,
      aliases: bool,
      testTable: `
        '${dateNotation('2004-12-25Z')}' '${dateNotation('2004-12-25-05:00')}' = true
        '${dateNotation('2004-12-25-12:00')}' '${dateNotation('2004-12-26+12:00')}' = false
      `,
    });
  });

  describe('respect the op:date-greater-than xpath-functions spec', () => {
    // Originates from: https://www.w3.org/TR/xpath-functions/#func-date-less-than
    runTestTable({
      operation: '>',
      arity: 2,
      notation: Notation.Infix,
      aliases: bool,
      testTable: `
        '${dateNotation('2004-12-25Z')}' '${dateNotation('2004-12-25+07:00')}' = true
        '${dateNotation('2004-12-25-12:00')}' '${dateNotation('2004-12-26+12:00')}' = false
      `,
    });
  });
});
