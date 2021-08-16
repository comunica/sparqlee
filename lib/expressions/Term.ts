import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';

import type { LiteralTypes } from '../util/Consts';
import * as C from '../util/Consts';
import { TypeAlias, TypeURL } from '../util/Consts';
import * as Err from '../util/Errors';
import { isSubTypeOf } from '../util/TypeHandling';
import type { TermExpression, TermType } from './Expressions';
import { ExpressionType } from './Expressions';

const DF = new DataFactory();

export abstract class Term implements TermExpression {
  public expressionType: ExpressionType.Term = ExpressionType.Term;
  abstract termType: TermType;

  abstract toRDF(): RDF.Term;

  public str(): string {
    throw new Err.InvalidArgumentTypes([ this ], C.RegularOperator.STR);
  }

  public coerceEBV(): boolean {
    throw new Err.EBVCoercionError(this);
  }
}

// NamedNodes -----------------------------------------------------------------
export class NamedNode extends Term {
  public termType: TermType = 'namedNode';
  public constructor(public value: string) {
    super();
  }

  public toRDF(): RDF.Term {
    return DF.namedNode(this.value);
  }

  public str(): string {
    return this.value;
  }
}

// BlankNodes -----------------------------------------------------------------

export class BlankNode extends Term {
  public static _nextID = 0;

  public value: RDF.BlankNode;
  public termType: TermType = 'blankNode';

  public constructor(value: RDF.BlankNode | string) {
    super();
    this.value = typeof value === 'string' ? DF.blankNode(value) : value;
  }

  public static nextID(): string {
    BlankNode._nextID += 1;
    return BlankNode.nextID.toString();
  }

  public toRDF(): RDF.Term {
    return this.value;
  }
}

// Literals-- -----------------------------------------------------------------
export function isLiteralTermExpression(expr: TermExpression): Literal<any> | undefined {
  if (expr.termType === 'literal') {
    return <Literal<any>> expr;
  }
  return undefined;
}
export class Literal<T> extends Term {
  public termType: 'literal' = 'literal';

  /**
   * @param typedValue internal representation of this literal's value
   * @param dataType a string representing the datatype. Can be of type @see LiteralTypes or any URI
   * @param strValue the string value of this literal. In other words, the string representing the RDF.literal value.
   * @param language the language, mainly for language enabled strings like RDF_LANG_STRING
   */
  public constructor(
    public typedValue: T,
    public dataType: string,
    public strValue?: string,
    public language?: string,
  ) {
    super();
  }

  public toRDF(): RDF.Term {
    return DF.literal(
      this.strValue || this.str(),
      this.language || DF.namedNode(this.dataType),
    );
  }

  public str(): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return this.strValue || this.typedValue.toString();
  }
}

class TypeCheckedLiteral<T> extends Literal<T> {
  public dataType: LiteralTypes;
  public constructor(
    typeToCheck: LiteralTypes,
    public typedValue: T,
    dataType?: string,
    public strValue?: string,
    public language?: string,
  ) {
    super(typedValue, dataType || typeToCheck, strValue, language);
    if (dataType && !isSubTypeOf(dataType, typeToCheck)) {
      throw this.getTypeError(typeToCheck);
    }
    this.dataType = <LiteralTypes> dataType || typeToCheck;
  }

  protected getTypeError(typeToImplement: string): Error {
    return new Error(
      `TypeUrl '${this.dataType}' provided but expected a type implementing ${typeToImplement}`,
    );
  }
}

export class NumericLiteral extends TypeCheckedLiteral<number> {
  public constructor(
    public typedValue: number,
    dataType: string,
    public strValue?: string,
    public language?: string,
  ) {
    super(TypeAlias.SPARQL_NUMERIC, typedValue, dataType, strValue, language);
  }

  private specificFormatterCreator(type: LiteralTypes): ((val: number) => string) {
    if (isSubTypeOf(type, TypeURL.XSD_INTEGER)) {
      return value => value.toFixed(0);
    }
    if (isSubTypeOf(type, TypeURL.XSD_DECIMAL)) {
      return value => value.toString();
    }
    if (isSubTypeOf(type, TypeURL.XSD_FLOAT)) {
      return value => value.toString();
    }
    // Since we checked on construction on this being a TypeAlias.SPARQL_NUMERIC. This can only be an TypeURL.XSD_DOUBLE
    // https://www.w3.org/TR/xmlschema-2/#double
    return value => {
      const jsExponential = value.toExponential();
      const [ jsMantisse, jsExponent ] = jsExponential.split('e');

      // Leading + must be removed for integer
      // https://www.w3.org/TR/xmlschema-2/#integer
      const exponent = jsExponent.replace(/\+/u, '');

      // SPARQL test suite prefers trailing zero's
      const mantisse = jsMantisse.includes('.') ?
        jsMantisse :
        `${jsMantisse}.0`;

      return `${mantisse}E${exponent}`;
    };
  }

  public coerceEBV(): boolean {
    return !!this.typedValue;
  }

  public toRDF(): RDF.Term {
    const term = super.toRDF();
    if (!Number.isFinite(this.typedValue)) {
      term.value = term.value.replace('Infinity', 'INF');
    }
    return term;
  }

  public str(): string {
    return this.strValue ||
      this.specificFormatterCreator(this.dataType)(this.typedValue);
  }
}

export class BooleanLiteral extends TypeCheckedLiteral<boolean> {
  public constructor(public typedValue: boolean, public strValue?: string, dataType?: string) {
    super(C.TypeURL.XSD_BOOLEAN, typedValue, dataType, strValue);
  }

  public coerceEBV(): boolean {
    return !!this.typedValue;
  }
}

export class DateTimeLiteral extends TypeCheckedLiteral<Date> {
  // StrValue is mandatory here because toISOString will always add
  // milliseconds, even if they were not present.
  public constructor(public typedValue: Date, public strValue: string, dataType?: string) {
    super(C.TypeURL.XSD_DATE_TIME, typedValue, dataType, strValue);
  }
}

export class LangStringLiteral extends TypeCheckedLiteral<string> {
  public constructor(public typedValue: string, public language: string, dataType?: string) {
    super(C.TypeURL.RDF_LANG_STRING, typedValue, dataType, typedValue, language);
  }

  public coerceEBV(): boolean {
    return this.strValue.length > 0;
  }
}

// https://www.w3.org/TR/2004/REC-rdf-concepts-20040210/#dfn-plain-literal
// https://www.w3.org/TR/sparql11-query/#defn_SimpleLiteral
// https://www.w3.org/TR/sparql11-query/#func-strings
// This does not include language tagged literals
export class StringLiteral extends TypeCheckedLiteral<string> {
  /**
   * @param typedValue
   * @param dataType Should be type that implements XSD_STRING
   */
  public constructor(public typedValue: string, dataType?: string) {
    super(C.TypeURL.XSD_STRING, typedValue, dataType, typedValue);
  }

  public coerceEBV(): boolean {
    return this.strValue.length > 0;
  }
}

/**
 * This class is used when a literal is parsed, and it's value is
 * an invalid lexical form for it's datatype. The spec defines value with
 * invalid lexical form are still valid terms, and as such we can not error
 * immediately. This class makes sure that the typedValue will remain undefined,
 * and the category 'nonlexical'. This way, only when operators apply to the
 * 'nonlexical' category, they will keep working, otherwise they will throw a
 * type error.
 * This seems to match the spec, except maybe for functions that accept
 * non-lexical values for their datatype.
 *
 * See:
 *  - https://www.w3.org/TR/xquery/#dt-type-error
 *  - https://www.w3.org/TR/rdf-concepts/#section-Literal-Value
 *  - https://www.w3.org/TR/xquery/#dt-ebv
 *  - ... some other more precise thing i can't find...
 */
export class NonLexicalLiteral extends Literal<undefined> {
  public constructor(
    typedValue: undefined,
    public typeURL: string,
    strValue?: string,
    language?: string,
  ) {
    super(typedValue, typeURL, strValue, language);
    this.typedValue = undefined;
    this.dataType = TypeAlias.SPARQL_NON_LEXICAL;
  }

  public coerceEBV(): boolean {
    const isNumericOrBool =
      isSubTypeOf(this.typeURL, TypeURL.XSD_BOOLEAN) ||
      isSubTypeOf(this.typeURL, TypeAlias.SPARQL_NUMERIC);
    if (isNumericOrBool) {
      return false;
    }
    throw new Err.EBVCoercionError(this);
  }

  public toRDF(): RDF.Term {
    return DF.literal(
      this.str(),
      this.language || DF.namedNode(this.typeURL),
    );
  }

  public str(): string {
    return this.strValue;
  }
}
