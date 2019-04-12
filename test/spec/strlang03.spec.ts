import * as Data from './_data';

/**
 * REQUEST: strlang03.rq
 *
 * PREFIX : <http://example.org/>
 * SELECT ?s (STRLANG(?o,"en-US") AS ?str1) WHERE {
 *   ?s ?p ?o
 * }
 */

/**
 *
 * :strlang03-rdf11 rdf:type mf:QueryEvaluationTest ;
 *   mf:name    "STRLANG() TypeErrors (updated for RDF 1.1)" ;
 *   mf:feature sparql:strlang ;
 *     dawgt:approval dawgt:Proposed ;
 *     mf:action
 *          [ qt:query  <strlang03.rq> ;
 *            qt:data   <data.ttl> ] ;
 *     mf:result  <strlang03-rdf11.srx> ;
 *   .
 */

describe('We should respect the strlang03 spec', () => {

});

/**
 * RESULTS: strlang03.srx
 *
 * <?xml version="1.0" encoding="utf-8"?>
 * <sparql xmlns="http://www.w3.org/2005/sparql-results#">
 * <head>
 *   <variable name="s"/>
 *   <variable name="str1"/>
 * </head>
 * <results>
 *     <result><binding name="s"><uri>http://example.org/n1</uri></binding></result>
 *     <result><binding name="s"><uri>http://example.org/n2</uri></binding></result>
 *     <result><binding name="s"><uri>http://example.org/n3</uri></binding></result>
 *     <result><binding name="s"><uri>http://example.org/n4</uri></binding></result>
 *     <result><binding name="s"><uri>http://example.org/n5</uri></binding></result>
 *     
 *     <result>
 *       <binding name="s"><uri>http://example.org/s1</uri></binding>
 *       <binding name="str1"><literal xml:lang="en-us">foo</literal></binding>
 *     </result>
 *     <result><binding name="s"><uri>http://example.org/s2</uri></binding></result>
 *     <result>
 *       <binding name="s"><uri>http://example.org/s3</uri></binding>
 *       <binding name="str1"><literal xml:lang="en-us">BAZ</literal></binding>
 *     </result>
 *     <result>
 *       <binding name="s"><uri>http://example.org/s4</uri></binding>
 *       <binding name="str1"><literal xml:lang="en-us">食べ物</literal></binding>
 *     </result>
 *     <result>
 *       <binding name="s"><uri>http://example.org/s5</uri></binding>
 *       <binding name="str1"><literal xml:lang="en-us">100%</literal></binding>
 *     </result>
 *     <result><binding name="s"><uri>http://example.org/s6</uri></binding></result>
 *     <result><binding name="s"><uri>http://example.org/s7</uri></binding></result>
 *
 *     <result><binding name="s"><uri>http://example.org/d1</uri></binding></result>
 *     <result><binding name="s"><uri>http://example.org/d2</uri></binding></result>
 *     <result><binding name="s"><uri>http://example.org/d3</uri></binding></result>
 *     <result><binding name="s"><uri>http://example.org/d4</uri></binding></result>
 * </results>
 * </sparql>
 */

