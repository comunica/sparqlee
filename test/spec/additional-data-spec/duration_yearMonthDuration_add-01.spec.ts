/* eslint max-len: 0 */
import {
  dateNotation,
  dateTimeNotation,
  yearMonthDurationNotation,
} from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('Add duration and yearMonthDuration 01', () => {
  /**
   * PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
   * SELECT (?d + ?duration AS ?next_year)
   * WHERE {
   *  VALUES (?duration ?d) {
   *    ("P1Y"^^xsd:yearMonthDuration"2019-05-28T12:14:45Z"^^xsd:dateTime)
   *    ("P1Y"^^xsd:yearMonthDuration"2019-05-28"^^xsd:date)
   *  }
   * }
   */

  describe('respect the duration_dayTimeDuration_add-01 spec', () => {
    runTestTable({
      operation: '+',
      arity: 2,
      notation: Notation.Infix,
      testTable: `
        '${dateTimeNotation('2019-05-28T12:14:45Z')}' '${yearMonthDurationNotation('P1Y')}' = '${dateTimeNotation('2020-05-28T12:14:45Z')}'
        '${dateNotation('2019-05-28')}' '${yearMonthDurationNotation('P1Y')}' = '${dateNotation('2020-05-28')}'
      `,
    });
  });

  /**
   * <?xml version="1.0" encoding="utf-8"?>
   * <sparql xmlns="http://www.w3.org/2005/sparql-results#">
   * <head>
   *  <variable name="next_year"/>
   * </head>
   * <results>
   *    <result>
   *      <binding name="next_year"><literal datatype="http://www.w3.org/2001/XMLSchema#dateTime">2020-05-28T12:14:45Z</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="next_year"><literal datatype="http://www.w3.org/2001/XMLSchema#date">2020-05-28</literal></binding>
   *    </result>
   * </results>
   * </sparql>
   */
});
