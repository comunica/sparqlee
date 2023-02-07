import {bool, dayTimeDurationNotation, durationNotation, yearMonthDurationNotation} from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('compare duration 01', () => {
  /**
   * PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
   * SELECT ?id ?eq WHERE {
   * 	VALUES (?id ?l ?r) {
   * 		(1 "P1Y"^^xsd:duration "P1Y"^^xsd:duration)
   * 		(2 "P1Y"^^xsd:duration "P12M"^^xsd:duration)
   * 		(3 "P1Y"^^xsd:duration "P365D"^^xsd:duration)
   * 		(4 "P0Y"^^xsd:duration "PT0S"^^xsd:duration)
   * 		(5 "P1D"^^xsd:duration "PT24H"^^xsd:duration)
   * 		(6 "P1D"^^xsd:duration "PT23H"^^xsd:duration)
   * 		(7 "PT1H"^^xsd:duration "PT60M"^^xsd:duration)
   * 		(8 "PT1H"^^xsd:duration "PT3600S"^^xsd:duration)
   * 		(9 "-P1Y"^^xsd:duration "P1Y"^^xsd:duration)
   * 		(10 "-P0Y"^^xsd:duration "PT0S"^^xsd:duration)
   * 	}
   * 	BIND(?l = ?r AS ?eq)
   * }
   */

  describe('respect the compare_duration-01 spec', () => {
    runTestTable({
      operation: '=',
      arity: 2,
      notation: Notation.Infix,
      aliases: bool,
      // TODO: this is probably not what they wanted :/
      testTable: `
        '${durationNotation('P1Y')}' '${durationNotation('P366D')}' = false
        
        '${durationNotation('P1Y')}' '${durationNotation('P1Y')}' = true
        '${durationNotation('P1Y')}' '${durationNotation('P12M')}' = true
        '${durationNotation('P1Y')}' '${durationNotation('P365D')}' = false
        '${durationNotation('P0Y')}' '${durationNotation('PT0S')}' = true
        '${durationNotation('P1D')}' '${durationNotation('PT24H')}' = true
        '${durationNotation('P1D')}' '${durationNotation('PT23H')}' = false
        '${durationNotation('PT1H')}' '${durationNotation('PT60M')}' = true
        '${durationNotation('PT1H')}' '${durationNotation('PT3600S')}' = true
        '${durationNotation('-P1Y')}' '${durationNotation('P1Y')}' = false
        '${durationNotation('-P0Y')}' '${durationNotation('PT0S')}' = true
      `,
    });
  });

  /**
   * <?xml version="1.0" encoding="utf-8"?>
   * <sparql xmlns="http://www.w3.org/2005/sparql-results#">
   * <head>
   *  <variable name="id"/>
   *  <variable name="eq"/>
   * </head>
   * <results>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">1</literal></binding>
   *      <binding name="eq"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">true</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">2</literal></binding>
   *      <binding name="eq"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">true</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">3</literal></binding>
   *      <binding name="eq"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">false</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">4</literal></binding>
   *      <binding name="eq"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">true</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">5</literal></binding>
   *      <binding name="eq"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">true</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">6</literal></binding>
   *      <binding name="eq"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">false</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">7</literal></binding>
   *      <binding name="eq"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">true</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">8</literal></binding>
   *      <binding name="eq"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">true</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">9</literal></binding>
   *      <binding name="eq"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">false</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">10</literal></binding>
   *      <binding name="eq"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">true</literal></binding>
   *    </result>
   * </results>
   * </sparql>
   */
});
