import type * as RDF from '@rdfjs/types';
import * as RDFString from 'rdf-string';
import type { Algebra as Alg } from 'sparqlalgebrajs';
import { Algebra } from 'sparqlalgebrajs';
import * as E from '../expressions';
import { TypeURL } from '../util/Consts';
import {
  dateParser,
  dateTimeParser,
  dayTimeDurationParser,
  durationParser,
  timeParser,
  yearMonthDurationParser,
} from '../util/DateTimeHelpers';
import * as Err from '../util/Errors';
import * as P from '../util/Parsing';
import { getSuperTypeDict } from '../util/TypeHandling';
import type { ISuperTypeProvider,
  GeneralSuperTypeDict } from '../util/TypeHandling';

export interface ITermTransformer {
  transformRDFTermUnsafe: (term: RDF.Term) => E.Term;
  transformLiteral: (lit: RDF.Literal) => E.Literal<any>;
}

export class TermTransformer implements ITermTransformer {
  public constructor(protected readonly superTypeProvider: ISuperTypeProvider) { }

  /**
   * Transforms an RDF term to the internal representation of a term,
   * assuming it is not a variable, which would be an expression (internally).
   *
   * @param term RDF term to transform into internal representation of a term
   */
  public transformRDFTermUnsafe(term: RDF.Term): E.Term {
    return <E.Term> this.transformTerm({
      term,
      type: Algebra.types.EXPRESSION,
      expressionType: Algebra.expressionTypes.TERM,
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
    const superTypeDict: GeneralSuperTypeDict = getSuperTypeDict(dataType, this.superTypeProvider);

    // The order of checking matters! Check most specific types first!
    if (TypeURL.XSD_STRING in superTypeDict) {
      return new E.StringLiteral(lit.value, dataType);
    }
    if (TypeURL.RDF_LANG_STRING in superTypeDict) {
      return new E.LangStringLiteral(lit.value, lit.language);
    }
    if (TypeURL.XSD_YEAR_MONTH_DURATION in superTypeDict) {
      return new E.YearMonthDurationLiteral(yearMonthDurationParser(lit.value), lit.value, dataType);
    }
    if (TypeURL.XSD_DAY_TIME_DURATION in superTypeDict) {
      return new E.DayTimeDurationLiteral(dayTimeDurationParser(lit.value), lit.value, dataType);
    }
    // TODO: maybe the special notations need to be checked so we don't Years in a DayTimeDuration? ...
    if (TypeURL.XSD_DURATION in superTypeDict) {
      // TODO: All of these new parsers can fail, a failure should result in a NonLexicalLiteral!
      return new E.DurationLiteral(durationParser(lit.value), lit.value, dataType);
    }
    if (TypeURL.XSD_DATE_TIME in superTypeDict) {
      // TODO: this is no longer true. I don't know what the talk about timestamp is though

      // It should be noted how we don't care if its a XSD_DATE_TIME_STAMP or not.
      // This is because sparql functions don't care about the timezone.
      // It also doesn't break the specs because we keep the string representation stored,
      // that way we can always give it back. There are also no sparql functions that alter a date.
      // (So the initial representation always stays valid)
      // https://github.com/comunica/sparqlee/pull/103#discussion_r688462368
      const dateVal: Date = new Date(lit.value);
      if (Number.isNaN(dateVal.getTime())) {
        return new E.NonLexicalLiteral(undefined, dataType, this.superTypeProvider, lit.value);
      }
      return new E.DateTimeLiteral(dateTimeParser(lit.value), lit.value, dataType);
    }
    if (TypeURL.XSD_DATE in superTypeDict) {
      return new E.DateLiteral(dateParser(lit.value), lit.value, dataType);
    }
    if (TypeURL.XSD_TIME in superTypeDict) {
      return new E.TimeLiteral(timeParser(lit.value), lit.value, dataType);
    }
    if (TypeURL.XSD_BOOLEAN in superTypeDict) {
      if (lit.value !== 'true' && lit.value !== 'false' && lit.value !== '1' && lit.value !== '0') {
        return new E.NonLexicalLiteral(undefined, dataType, this.superTypeProvider, lit.value);
      }
      return new E.BooleanLiteral(lit.value === 'true' || lit.value === '1', lit.value);
    }
    if (TypeURL.XSD_DECIMAL in superTypeDict) {
      const intVal: number | undefined = P.parseXSDDecimal(lit.value);
      if (intVal === undefined) {
        return new E.NonLexicalLiteral(undefined, dataType, this.superTypeProvider, lit.value);
      }
      if (TypeURL.XSD_INTEGER in superTypeDict) {
        return new E.IntegerLiteral(intVal, dataType, lit.value);
      }
      // If type is not an integer it's just a decimal.
      return new E.DecimalLiteral(intVal, dataType, lit.value);
    }
    const isFloat = TypeURL.XSD_FLOAT in superTypeDict;
    const isDouble = TypeURL.XSD_DOUBLE in superTypeDict;
    if (isFloat || isDouble) {
      const doubleVal: number | undefined = P.parseXSDFloat(lit.value);
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
