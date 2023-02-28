/* eslint max-len: 0 */
import { dateNotation, dateTimeNotation, dayTimeDurationNotation, timeNotation } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('dateTime subtract', () => {
  /**
   * PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
   * SELECT (?l - ?r AS ?duration)
   * WHERE {
   *  VALUES (?l ?r) {
   *    ("2000-10-30T06:12:00-05:00"^^xsd:dateTime "1999-11-28T09:00:00Z"^^xsd:dateTime)
   *    ("2000-10-30"^^xsd:date                    "1999-11-28"^^xsd:date)
   *    ("11:12:00Z"^^xsd:time                     "04:00:00-05:00"^^xsd:time)
   *  }
   * }
   */

  describe('respect the construct_time-02 spec', () => {
    runTestTable({
      operation: '-',
      arity: 2,
      notation: Notation.Infix,
      testTable: `
        '${dateTimeNotation('2000-10-30T06:12:00-05:00')}' '${dateTimeNotation('1999-11-28T09:00:00Z')}' = '${dayTimeDurationNotation('P337DT2H12M')}'
        '${dateNotation('2000-10-30')}' '${dateNotation('1999-11-28')}' = '${dayTimeDurationNotation('P337D')}'
        '${timeNotation('11:12:00Z')}' '${timeNotation('04:00:00-05:00')}' = '${dayTimeDurationNotation('PT2H12M')}'
      `,
    });
  });

  /**
   * <?xml version="1.0" encoding="utf-8"?>
   * <sparql xmlns="http://www.w3.org/2005/sparql-results#">
   * <head>
   *  <variable name="duration"/>
   * </head>
   * <results>
   *    <result>
   *      <binding name="duration"><literal datatype="http://www.w3.org/2001/XMLSchema#dayTimeDuration">P337DT2H12M</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="duration"><literal datatype="http://www.w3.org/2001/XMLSchema#dayTimeDuration">P337D</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="duration"><literal datatype="http://www.w3.org/2001/XMLSchema#dayTimeDuration">PT2H12M</literal></binding>
   *    </result>
   * </results>
   * </sparql>
   */
});
