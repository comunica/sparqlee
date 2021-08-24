import type * as RDF from '@rdfjs/types';
import * as RDFString from 'rdf-string';
import type { Algebra as Alg } from 'sparqlalgebrajs';
import * as E from '../expressions';
import { TypeURL as DT, TypeURL } from '../util/Consts';
import * as Err from '../util/Errors';
import * as P from '../util/Parsing';
import { isSubTypeOf } from '../util/TypeHandling';
import type { ISuperTypeProvider } from '../util/TypeHandling';

export interface ITermTransformer {
  transformRDFTermUnsafe: (term: RDF.Term) => E.Term;
  transformLiteral: (lit: RDF.Literal) => E.Literal<any>;
}

export class TermTransformer implements ITermTransformer {
  public constructor(protected readonly superTypeProvider: ISuperTypeProvider) {
  }

  /**
   * Transforms an RDF term to the internal representation of a term,
   * assuming it is not a variable, which would be an expression (internally).
   *
   * @param term RDF term to transform into internal representation of a term
   */
  public transformRDFTermUnsafe(term: RDF.Term): E.Term {
    return <E.Term> this.transformTerm({
      term,
      type: 'expression',
      expressionType: 'term',
    });
  }

  protected transformTerm(term: Alg.TermExpression): E.Expression {
    if (!term.term) {
      throw new Err.InvalidExpression(term);
    }

    switch (term.term.termType) {
      case 'Variable':
        return new E.Variable(RDFString.termToString(term.term));
      case 'Literal':
        return this.transformLiteral(term.term);
      case 'NamedNode':
        return new E.NamedNode(term.term.value);
      case 'BlankNode':
        return new E.BlankNode(term.term.value);
      default:
        throw new Err.InvalidTermType(term);
    }
  }

  /**
   * @param lit the rdf literal we want to transform to an internal Literal expression.
   */
  public transformLiteral(lit: RDF.Literal): E.Literal<any> {
    // Both here and within the switch we transform to LangStringLiteral or StringLiteral.
    // We do this when we detect a simple literal being used.
    // Original issue regarding this behaviour: https://github.com/w3c/sparql-12/issues/112
    if (!lit.datatype || [ null, undefined, '' ].includes(lit.datatype.value)) {
      return lit.language ?
        new E.LangStringLiteral(lit.value, lit.language) :
        new E.StringLiteral(lit.value);
    }

    const dataType = lit.datatype.value;

    if (isSubTypeOf(dataType, TypeURL.XSD_STRING, this.superTypeProvider)) {
      return new E.StringLiteral(lit.value, dataType);
    }
    if (isSubTypeOf(dataType, DT.RDF_LANG_STRING, this.superTypeProvider)) {
      return new E.LangStringLiteral(lit.value, lit.language);
    }
    if (isSubTypeOf(dataType, DT.XSD_DATE_TIME, this.superTypeProvider)) {
      // It should be noted how we don't care if its a XSD_DATE_TIME_STAMP or not.
      // This is because sparql functions don't care about the timezone.
      // It's also doesn't break the specs because we keep the string representation stored,
      // that way we can always give it back. There are also no sparql functions that alter a date.
      // (So the representation initial representation always stays valid)
      // https://github.com/comunica/sparqlee/pull/103#discussion_r688462368
      const dateVal: Date = new Date(lit.value);
      if (Number.isNaN(dateVal.getTime())) {
        return new E.NonLexicalLiteral(undefined, dataType, this.superTypeProvider, lit.value);
      }
      return new E.DateTimeLiteral(new Date(lit.value), lit.value, dataType);
    }
    if (isSubTypeOf(dataType, DT.XSD_BOOLEAN, this.superTypeProvider)) {
      if (lit.value !== 'true' && lit.value !== 'false' && lit.value !== '1' && lit.value !== '0') {
        return new E.NonLexicalLiteral(undefined, dataType, this.superTypeProvider, lit.value);
      }
      return new E.BooleanLiteral(lit.value === 'true' || lit.value === '1', lit.value);
    }
    if (isSubTypeOf(dataType, DT.XSD_DECIMAL, this.superTypeProvider)) {
      const intVal: number = P.parseXSDDecimal(lit.value);
      if (intVal === undefined) {
        return new E.NonLexicalLiteral(undefined, dataType, this.superTypeProvider, lit.value);
      }
      if (isSubTypeOf(dataType, DT.XSD_INTEGER, this.superTypeProvider)) {
        return new E.IntegerLiteral(intVal, dataType, lit.value);
      }
      // If type is not an integer it's just a decimal.
      return new E.DecimalLiteral(intVal, dataType, lit.value);
    }
    const isFloat = isSubTypeOf(dataType, DT.XSD_FLOAT, this.superTypeProvider);
    const isDouble = isSubTypeOf(dataType, DT.XSD_DOUBLE, this.superTypeProvider);
    if (isFloat || isDouble) {
      const doubleVal: number = P.parseXSDFloat(lit.value);
      if (doubleVal === undefined) {
        return new E.NonLexicalLiteral(undefined, dataType, this.superTypeProvider, lit.value);
      }
      if (isFloat) {
        return new E.FloatLiteral(doubleVal, dataType, lit.value);
      }
      return new E.DoubleLiteral(doubleVal, dataType, lit.value);
    }
    return new E.Literal<string>(lit.value, dataType, lit.value);
  }
}
