import * as Data from './_data';

import { aliases as a, testAll } from '../util/utils';

/**
 * REQUEST: starts01.rq
 *
 * PREFIX : <http://example.org/>
 * PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
 * SELECT ?s ?str WHERE {
 *   ?s ?p ?str
 *   FILTER STRSTARTS(STR(?str), "1")
 * }
 */

/**
 * Manifest Entry
 * :starts01 rdf:type mf:QueryEvaluationTest ;
 *   mf:name    "STRSTARTS()" ;
 *   mf:feature sparql:strstarts ;
 *     dawgt:approval dawgt:Approved ;
 *     dawgt:approvedBy <http://www.w3.org/2009/sparql/meeting/2012-01-31#resolution_3> ;
 *     mf:action
 *          [ qt:query  <starts01.rq> ;
 *            qt:data   <data.ttl> ] ;
 *     mf:result  <starts01.srx> ;
 *   .
 */

describe('We should respect the starts01 spec', () => {
  const {} = Data.data();
  testAll([

  ]);
});

/**
 * RESULTS: starts01.srx
 *
 * <?xml version="1.0" encoding="utf-8"?>
 * <sparql xmlns="http://www.w3.org/2005/sparql-results#">
 * <head>
 *   <variable name="s"/>
 *   <variable name="str"/>
 * </head>
 * <results>
 *     <result>
 *       <binding name="s"><uri>http://example.org/n3</uri></binding>
 *       <binding name="str"><literal datatype="http://www.w3.org/2001/XMLSchema#decimal">1.1</literal></binding>
 *     </result>
 *     <result>
 *       <binding name="s"><uri>http://example.org/s5</uri></binding>
 *       <binding name="str"><literal>100%</literal></binding>
 *     </result>
 * </results>
 * </sparql>
 */
