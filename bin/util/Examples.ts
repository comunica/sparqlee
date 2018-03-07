import * as RDF from 'rdf-data-model';

import { Algebra as Alg, translate } from 'sparqlalgebrajs';
import { Bindings } from "../../lib/core/Bindings";
import { DataType as DT } from '../../lib/util/Consts';

export class Example {
  public expression: Alg.Expression;
  public mapping: () => Bindings;

  constructor(expr: string, mapping: () => Bindings) {
    this.expression = parse(expr);
    this.mapping = mapping;
  }
}

export const example1 = (() => {
  const str = '((?age + ?otherAge) = "50"^^xsd:integer) && (?joinYear > "2005-01-01T00:00:00Z"^^xsd:dateTime)';
  const mapping = () => {
    const randAge = Math.floor((Math.random() * 100));
    const beSame = Math.random() > 0.7;
    const randOtherAge = (beSame)
      ? 50 - randAge
      : Math.floor((Math.random() * 100));
    const randYear = 1980 + Math.floor(Math.random() * 40);

    return Bindings({
      age: RDF.literal(randAge.toString(), RDF.namedNode(DT.XSD_INTEGER)),
      joinYear: RDF.literal(`${randYear}-03-03T00:00:00Z`, RDF.namedNode(DT.XSD_DATE_TIME)),
      otherAge: RDF.literal(randOtherAge.toString(), RDF.namedNode(DT.XSD_INTEGER)),
    });
  };
  return new Example(str, mapping);
})();

export function parse(expr: string): Alg.Expression {
  // Build mock SPARQL query with expression in the filter
  const queryString = `PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> SELECT * WHERE { ?s ?p ?o FILTER (${expr})}`;
  const sparqlQuery = translate(queryString);

  // Extract filter expression from complete query
  return sparqlQuery.input.expression;
}
