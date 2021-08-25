import { date } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('date function', () => {
  const d1 = date('2010-06-21T11:28:01-00:00');
  const d2 = date('2010-12-21T15:38:02-10:00');
  const d3 = date('2010-12-21T15:38:02-11:00');
  const d4 = date('2010-12-21T15:38:02+11:30');

  describe('evaluation of \'timezone\' like', () => {
    runTestTable({
      operation: 'TIMEZONE',
      notation: Notation.Function,
      arity: 1,
      // TODO: PR: is this first option really what we want? I'm pretty sure we want PT0S
      testTable: `
      '${d1}' = "-PT"^^xsd:dayTimeDuration
      '${d2}' = "-PT10H"^^xsd:dayTimeDuration
      '${d3}' = "-PT11H"^^xsd:dayTimeDuration
      '${d4}' = "PT11H30M"^^xsd:dayTimeDuration
    `,
    });
  });
});
