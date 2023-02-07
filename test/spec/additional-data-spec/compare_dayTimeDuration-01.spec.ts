import { bool, dayTimeDurationNotation } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('compare dayTimeDuration 01', () => {
  /**
   * PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
   * SELECT ?id ?lt ?gt WHERE {
   * 	VALUES (?id ?l ?r) {
   * 		(1 "PT1H"^^xsd:dayTimeDuration "PT63M"^^xsd:dayTimeDuration)
   * 		(2 "PT3S"^^xsd:dayTimeDuration "PT2M"^^xsd:dayTimeDuration)
   * 		(3 "-PT1H1M"^^xsd:dayTimeDuration "-PT62M"^^xsd:dayTimeDuration)
   * 		(4 "PT0S"^^xsd:dayTimeDuration "-PT0.1S"^^xsd:dayTimeDuration)
   * 	}
   * 	BIND(?l < ?r AS ?lt)
   * 	BIND(?l > ?r AS ?gt)
   * }
   */

  describe('respect the lesserThan compare_dayTimeDuration-01 spec', () => {
    runTestTable({
      operation: '<',
      arity: 2,
      notation: Notation.Infix,
      aliases: bool,
      testTable: `
        '${dayTimeDurationNotation('PT1H')}' '${dayTimeDurationNotation('PT63M')}' = true
        '${dayTimeDurationNotation('PT3S')}' '${dayTimeDurationNotation('PT2M')}' = true
        '${dayTimeDurationNotation('-PT1H1M')}' '${dayTimeDurationNotation('-PT62M')}' = false
        '${dayTimeDurationNotation('PT0S')}' '${dayTimeDurationNotation('-PT0.1S')}' = false
      `,
    });
  });

  describe('respect the largerThan compare_dayTimeDuration-01 spec', () => {
    runTestTable({
      operation: '>',
      arity: 2,
      notation: Notation.Infix,
      aliases: bool,
      testTable: `
        '${dayTimeDurationNotation('PT1H')}' '${dayTimeDurationNotation('PT63M')}' = false
        '${dayTimeDurationNotation('PT3S')}' '${dayTimeDurationNotation('PT2M')}' = false
        '${dayTimeDurationNotation('-PT1H1M')}' '${dayTimeDurationNotation('-PT62M')}' = true
        '${dayTimeDurationNotation('PT0S')}' '${dayTimeDurationNotation('-PT0.1S')}' = true
      `,
    });
  });

  /**
   * <?xml version="1.0" encoding="utf-8"?>
   * <sparql xmlns="http://www.w3.org/2005/sparql-results#">
   * <head>
   *  <variable name="id"/>
   *  <variable name="lt"/>
   *  <variable name="gt"/>
   * </head>
   * <results>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">1</literal></binding>
   *      <binding name="lt"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">true</literal></binding>
   *      <binding name="gt"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">false</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">2</literal></binding>
   *      <binding name="lt"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">true</literal></binding>
   *      <binding name="gt"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">false</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">3</literal></binding>
   *      <binding name="lt"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">false</literal></binding>
   *      <binding name="gt"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">true</literal></binding>
   *    </result>
   *    <result>
   *      <binding name="id"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">4</literal></binding>
   *      <binding name="lt"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">false</literal></binding>
   *      <binding name="gt"><literal datatype="http://www.w3.org/2001/XMLSchema#boolean">true</literal></binding>
   *    </result>
   * </results>
   * </sparql>
   */
});
