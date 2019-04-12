import * as Data from './_data';

import { aliases as a, testAll } from '../util/utils';

/**
 * REQUEST: coalesce01.rq
 *
 * PREFIX : <http://example.org/>
 * PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
 * SELECT
 *   (COALESCE(?x, -1) AS ?cx)     # error when ?x is unbound -> -1
 *   (COALESCE(?o/?x, -2) AS ?div) # error when ?x is unbound or zero -> -2
 *   (COALESCE(?z, -3) AS ?def)    # always unbound -> -3
 *   (COALESCE(?z) AS ?err)        # always an error -> unbound
 * WHERE {
 *   ?s :p ?o .
 *   OPTIONAL {
 *     ?s :q ?x
 *   }
 * }
 */

/**
 * Manifest Entry
 * :coalesce01 rdf:type mf:QueryEvaluationTest ;
 *   mf:name    "COALESCE()" ;
 *   mf:feature sparql:coalesce ;
 *     dawgt:approval dawgt:Approved ;
 *     dawgt:approvedBy <http://www.w3.org/2009/sparql/meeting/2012-01-31#resolution_3> ;
 *     mf:action
 *          [ qt:query  <coalesce01.rq> ;
 *            qt:data   <data-coalesce.ttl> ] ;
 *     mf:result  <coalesce01.srx> ;
 *   .
 */

describe('We should respect the coalesce01 spec', () => {
  it('should handle all test cases correctly', () => {
    const {} = Data.data();
    testAll([

    ]);
  });
});

/**
 * RESULTS: coalesce01.srx
 *
 * <?xml version="1.0" encoding="utf-8"?>
 * <sparql xmlns="http://www.w3.org/2005/sparql-results#">
 * <head>
 *   <variable name="cx"/>
 *   <variable name="div"/>
 *   <variable name="def"/>
 *   <variable name="err"/>
 * </head>
 * <results>
 *     <result>
 *       <binding name="cx"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">-1</literal></binding>
 *       <binding name="div"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">-2</literal></binding>
 *       <binding name="def"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">-3</literal></binding>
 *     </result>
 *     <result>
 *       <binding name="cx"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">0</literal></binding>
 *       <binding name="div"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">-2</literal></binding>
 *       <binding name="def"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">-3</literal></binding>
 *     </result>
 *     <result>
 *       <binding name="cx"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">2</literal></binding>
 *       <binding name="div"><literal datatype="http://www.w3.org/2001/XMLSchema#decimal">0.0</literal></binding>
 *       <binding name="def"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">-3</literal></binding>
 *     </result>
 *     <result>
 *       <binding name="cx"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">2</literal></binding>
 *       <binding name="div"><literal datatype="http://www.w3.org/2001/XMLSchema#decimal">2.0</literal></binding>
 *       <binding name="def"><literal datatype="http://www.w3.org/2001/XMLSchema#integer">-3</literal></binding>
 *     </result>
 * </results>
 * </sparql>
 *
 */

