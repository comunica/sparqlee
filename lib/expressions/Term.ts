import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';

import type { LiteralTypes } from '../util/Consts';
import * as C from '../util/Consts';
import { TypeAlias, TypeURL } from '../util/Consts';
import * as Err from '../util/Errors';
import { typeCanBeProvidedTo } from '../util/TypeHandling';
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
  // TODO: Ask for PR: do we still need this type? I keep it just for NonLexicalLiteral right now.
  //  Do we need the TypeAlias.SPARQL_NON_LEXICAL? We might be able to just use typeURL.value?
  public type: LiteralTypes;

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
  public constructor(
    public typedValue: number,
    public typeURL: RDF.NamedNode,
    public strValue?: string,
    public language?: string,
  ) {
    super(typedValue, typeURL, strValue, language);
    if (!typeCanBeProvidedTo(<LiteralTypes> typeURL.value, TypeAlias.SPARQL_NUMERIC)) {
      throw this.getTypeError();
    }
  }

  private getTypeError(): Error {
    return new Error(`TypeUrl '${this.type}' provided to NumericLiteral should implement ${TypeAlias.SPARQL_NUMERIC}`);
  }

  private specificFormatterCreator(type: LiteralTypes): ((val: number) => string) {
    if (typeCanBeProvidedTo(type, TypeURL.XSD_INTEGER)) {
      return value => value.toFixed(0);
    }
    if (typeCanBeProvidedTo(type, TypeURL.XSD_DECIMAL)) {
      return value => value.toString();
    }
    if (typeCanBeProvidedTo(type, TypeURL.XSD_FLOAT)) {
      return value => value.toString();
    }
    if (typeCanBeProvidedTo(type, TypeURL.XSD_DOUBLE)) {
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
    return () => {
      throw this.getTypeError();
    };
  }

  public type: C.TypeURL;

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
      this.specificFormatterCreator(this.type)(this.typedValue);
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
  public constructor(public typedValue: Date, public strValue: string, dataType?: RDF.NamedNode) {
    super(typedValue, dataType || C.make(C.TypeURL.XSD_DATE_TIME), strValue);
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
  /**
   * @param typedValue
   * @param dataType Should be type that implements XSD_STRING
   */
  public constructor(public typedValue: string, dataType?: RDF.NamedNode) {
    super(typedValue, dataType || C.make(C.TypeURL.XSD_STRING), typedValue);
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
  private readonly shouldBeCategory: LiteralTypes;
  public constructor(
    typedValue: undefined,
    typeURL: RDF.NamedNode,
    strValue?: string,
    language?: string,
  ) {
    super(typedValue, typeURL, strValue, language);
    this.typedValue = undefined;
    this.type = TypeAlias.SPARQL_NON_LEXICAL;
    this.shouldBeCategory = C.type(typeURL.value);
  }

  public coerceEBV(): boolean {
    const isNumericOrBool =
      typeCanBeProvidedTo(this.shouldBeCategory, TypeURL.XSD_BOOLEAN) ||
      typeCanBeProvidedTo(this.shouldBeCategory, TypeAlias.SPARQL_NUMERIC);
    if (isNumericOrBool) {
      return false;
    }
    throw new Err.EBVCoercionError(this);
  }
}
