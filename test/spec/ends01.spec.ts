import * as Data from './_data';

import { aliases as a, testAll } from '../util/utils';

/**
 * REQUEST: ends01.rq
 *
 * PREFIX : <http://example.org/>
 * PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
 * SELECT ?s ?str WHERE {
 *   ?s ?p ?str
 *   FILTER STRENDS(?str, "bc")
 * }
 */

/**
 * Manifest Entry
 * :ends01 rdf:type mf:QueryEvaluationTest ;
 *   mf:name    "STRENDS()" ;
 *   mf:feature sparql:strends ;
 *     dawgt:approval dawgt:Approved ;
 *     dawgt:approvedBy <http://www.w3.org/2009/sparql/meeting/2012-01-31#resolution_3> ;
 *     mf:action
 *          [ qt:query  <ends01.rq> ;
 *            qt:data   <data.ttl> ] ;
 *     mf:result  <ends01.srx> ;
 *   .
 */

describe('We should respect the ends01 spec', () => {
  const {} = Data.data();
  testAll([

  ]);
});

/**
 * RESULTS: ends01.srx
 *
 * <?xml version="1.0" encoding="utf-8"?>
 * <sparql xmlns="http://www.w3.org/2005/sparql-results#">
 * <head>
 *   <variable name="s"/>
 *   <variable name="str"/>
 * </head>
 * <results>
 *     <result>
 *       <binding name="s"><uri>http://example.org/s6</uri></binding>
 *       <binding name="str"><literal datatype="http://www.w3.org/2001/XMLSchema#string">abc</literal></binding>
 *     </result>
 * </results>
 * </sparql>
 */
