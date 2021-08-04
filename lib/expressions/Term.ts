import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';

import * as C from '../util/Consts';
import * as Err from '../util/Errors';
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
export class Literal<T> extends Term {
  public termType: 'literal' = 'literal';
  public type: C.Type;

  public constructor(
    public typedValue: T,
    public typeURL: RDF.NamedNode,
    public strValue?: string,
    public language?: string,
  ) {
    super();
    this.type = C.type(typeURL.value);
  }

  public toRDF(): RDF.Term {
    return DF.literal(
      this.strValue || this.str(),
      this.language || this.typeURL,
    );
  }

  public str(): string {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return this.strValue || this.typedValue.toString();
  }
}

export class NumericLiteral extends Literal<number> {
  private static readonly specificFormatters: {[key in C.PrimitiveNumericType]: (val: number) => string } = {
    // Avoid emitting non lexical integers
    integer: value => value.toFixed(0),
    float: value => value.toString(),
    decimal: value => value.toString(),
    // // Be consistent with float
    // decimal: (value) => {
    //   const jsDecimal = value.toString();
    //   return jsDecimal.match(/\./)
    //     ? jsDecimal
    //     : jsDecimal + '.0';
    // },

    // https://www.w3.org/TR/xmlschema-2/#double
    double(value) {
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
    },
  };

  public type: C.PrimitiveNumericType;

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
      NumericLiteral.specificFormatters[this.type](this.typedValue);
  }
}

export class BooleanLiteral extends Literal<boolean> {
  public constructor(public typedValue: boolean, public strValue?: string) {
    super(typedValue, C.make(C.TypeURL.XSD_BOOLEAN), strValue);
  }

  public coerceEBV(): boolean {
    return !!this.typedValue;
  }
}

export class DateTimeLiteral extends Literal<Date> {
  // StrValue is mandatory here because toISOString will always add
  // milliseconds, even if they were not present.
  public constructor(public typedValue: Date, public strValue: string) {
    super(typedValue, C.make(C.TypeURL.XSD_DATE_TIME), strValue);
  }
}

export class LangStringLiteral extends Literal<string> {
  public constructor(public typedValue: string, public language: string) {
    super(typedValue, C.make(C.TypeURL.RDF_LANG_STRING), typedValue, language);
  }

  public coerceEBV(): boolean {
    return this.strValue.length > 0;
  }
}

// https://www.w3.org/TR/2004/REC-rdf-concepts-20040210/#dfn-plain-literal
// https://www.w3.org/TR/sparql11-query/#defn_SimpleLiteral
// https://www.w3.org/TR/sparql11-query/#func-strings
// This does not include language tagged literals
export class StringLiteral extends Literal<string> {
  public constructor(public typedValue: string) {
    super(typedValue, C.make(C.TypeURL.XSD_STRING), typedValue);
  }

  public coerceEBV(): boolean {
    return this.strValue.length > 0;
  }
}

/*
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
  private readonly shouldBeCategory: C.Type;
  public constructor(
    typedValue: undefined,
    typeURL: RDF.NamedNode,
    strValue?: string,
    language?: string,
  ) {
    super(typedValue, typeURL, strValue, language);
    this.typedValue = undefined;
    this.type = 'nonlexical';
    this.shouldBeCategory = C.type(typeURL.value);
  }

  public coerceEBV(): boolean {
    const isNumericOrBool =
      C.PrimitiveNumericTypes.contains(this.shouldBeCategory) ||
      this.shouldBeCategory === 'boolean';

    if (isNumericOrBool) {
      return false;
    }
    throw new Err.EBVCoercionError(this);
  }
}
