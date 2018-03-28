import * as Promise from 'bluebird';
import { List, Map } from 'immutable';
import * as _ from 'lodash';
import * as RDFDM from 'rdf-data-model';
import * as RDF from 'rdf-js';
import { Algebra } from 'sparqlalgebrajs';

import { Bindings } from '../core/Bindings';
import * as C from '../util/Consts';
import { InvalidArgumentTypes, InvalidArity, UnimplementedError } from '../util/Errors';

export enum expressionTypes {
  AGGREGATE = 'aggregate',
  EXISTENCE = 'existence',
  NAMED = 'named',
  OPERATOR = 'operator',
  TERM = 'term',
  VARIABLE = 'variable',
}

export interface IExpression {
  expressionType: 'aggregate' | 'existence' | 'named' | 'operator' | 'term' | 'variable';
}

export interface IAggregateExpression extends IExpression {
  expressionType: 'aggregate';
  aggregator: string;
  distinct: boolean;
  separator?: string; // used by GROUP_CONCAT
  expression: IExpression;
}

export interface IExistenceExpression extends IExpression {
  expressionType: 'existence';
  not: boolean;
  input: Algebra.Operation;
}

export interface INamedExpression extends IExpression {
  expressionType: 'named';
  name: RDF.NamedNode;
  args: IExpression[];
}

export interface IOperatorExpression extends IExpression {
  expressionType: 'operator';
  operator: string;
  args: IExpression[];
  operatorClass: 'simple' | 'overloaded' | 'special';
  // apply(args: Expression[], mapping: Bindings): TermExpression;
}

export type TermType = 'namedNode' | 'literal';
export interface ITermExpression extends IExpression {
  expressionType: 'term';
  termType: TermType;
  coerceEBV(): boolean;
  toRDF(): RDF.Term;
}

export interface IVariableExpression extends IExpression {
  expressionType: 'variable';
  name: string;
}

// ----------------------------------------------------------------------------
// Variable
// ----------------------------------------------------------------------------

export class Variable implements IVariableExpression {
  public expressionType: 'variable' = 'variable';
  public name: string;
  constructor(name: string) {
    this.name = name;
  }
}

// ----------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------
// TODO: Not all functions are operators, and a distinction should be made.
// All operators are functions though.
//
// https://math.stackexchange.com/questions/168378/what-is-an-operator-in-mathematics
// ----------------------------------------------------------------------------

// Argument Types and their specificity ---------------------------------------

// Function and operator arguments are 'flattened' in the SPARQL spec.
// If the argument is a literal, the datatype often also matters.
export type ArgumentType = 'term' | TermType | C.DataTypeCategory;

type TypeParents = {[key in ArgumentType]: List<ArgumentType>};

// TODO: Urgent
// const _typePairs: TypeParents = {
//   term: List(),
//   namedNode: List(),
//   literal: List(),
//   string: List(),
//   date: List(),
//   boolean: List(),
//   integer: List(),
//   decimal: List(),
//   float: List(),
//   double: List(),
//   simple: List(),
//   plain: List(),
//   other: List(),
// };

// // tslint:disable-next-line:variable-name
// export const CommonParentMap: Map<ArgumentType, List<ArgumentType>>
//   = Map(<any> _typePairs);

// Simple Operators -----------------------------------------------------------

// TODO Remove args argument

export class SimpleOperator implements IOperatorExpression {
  public expressionType: 'operator' = 'operator';
  public operatorClass: 'simple' = 'simple';

  constructor(
    public operator: C.Operator,
    public arity: number,
    public args: IExpression[],
    public types: ArgumentType[],
    protected _apply: (args: ITermExpression[]) => ITermExpression,
  ) { }

  public apply(args: ITermExpression[]): ITermExpression {
    if (!this._isValidTypes(args)) {
      throw new InvalidArgumentTypes(args, this.operator);
    }
    return this._apply(args);
  }

  // TODO: Test
  // TODO Can be optimised probably
  private _isValidTypes(args: ITermExpression[]): boolean {
    const argTypes = args.map((a: any) => a.category || a.termType);
    return _.isEqual(this.types, argTypes)
      || _.isEqual(this.types, ['term', 'term']);
  }
}

// Overloaded Operators -------------------------------------------------------

/*
 * Varying kinds of operators take arguments of different types on which the
 * specific behaviour is dependant. Although their behaviour is often varying,
 * it is always relatively simple, and better suited for synced behaviour.
 * The types of their arguments are always terms, but might differ in
 * their term-type (eg: iri, literal),
 * their specific literal type (eg: string, integer),
 * their arity (see BNODE),
 * or even their specific numeric type (eg: integer, float).
 *
 * Examples include:
 *  - Arithmetic operations such as: *, -, /, +
 *  - Bool operators such as: =, !=, <=, <, ...
 *  - Functions such as: str, IRI
 *
 * Note: functions that have multiple arities do not belong in this category.
 * Eg: BNODE.
 * 
 * TODO: Make overloadMaps static and unique (use Definitions);
 *
 * See also: https://www.w3.org/TR/sparql11-query/#func-rdfTerms
 * and https://www.w3.org/TR/sparql11-query/#OperatorMapping
 */

// Maps argument types on their specific implementation.
export type OverloadMap = Map<List<ArgumentType>, SimpleEvaluator>;
export type SimpleEvaluator = (args: ITermExpression[]) => ITermExpression;

export class OverloadedOperator implements IOperatorExpression {
  public expressionType: 'operator' = 'operator';
  public operatorClass: 'overloaded' = 'overloaded';

  constructor(
    public operator: C.Operator,
    public arity: number,
    public args: IExpression[],
    private overloadMap: OverloadMap,
  ) { }

  public apply(args: ITermExpression[]): ITermExpression {
    const func = this._monomorph(args);
    if (!func) {
      throw new InvalidArgumentTypes(args, this.operator);
    }
    return func(args);
  }

  private _monomorph(args: ITermExpression[]): SimpleEvaluator {
    const argTypes = List(args.map((a: any) => a.category || a.termType));
    return this.overloadMap.get(argTypes)
      || this.overloadMap.get(List(Array(this.arity).fill('term')));
  }
}

// Special Operators ----------------------------------------------------------
/*
 * Special operators are those that don't really fit in sensible categories and
 * have extremely heterogeneous signatures that make them impossible to abstract
 * over. They are small in number, and their behaviour is often complex and open
 * for multiple correct implementations with different trade-offs.
 *
 * Due to their varying nature, they need all available information present
 * during evaluation. This reflects in the signature of the apply() method.
 *
 * They need access to an evaluator to be able to even implement their logic.
 * Especially relevant for IF, and the logical connectives.
 *
 * They can have both sync and async implementations, and both would make sense
 * in some contexts.
 */

export abstract class SpecialOperatorAsync implements IOperatorExpression {
  public expressionType: 'operator' = 'operator';
  public operatorClass: 'special' = 'special';

  constructor(public operator: C.Operator, public args: IExpression[]) { }

  public abstract apply(
    args: IExpression[],
    mapping: Bindings,
    evaluate: (e: IExpression, mapping: Bindings) => Promise<ITermExpression>,
  ): Promise<ITermExpression>;

}

// ----------------------------------------------------------------------------
// Terms
// ----------------------------------------------------------------------------

export abstract class Term implements ITermExpression {
  public expressionType: 'term' = 'term';
  public abstract termType: TermType;

  public coerceEBV(): boolean {
    throw new TypeError("Cannot coerce this term to EBV.");
  }

  public abstract toRDF(): RDF.Term;
}

export interface ILiteralTerm extends ITermExpression {
  category: C.DataTypeCategory;
}

export class Literal<T> extends Term implements ILiteralTerm {
  public expressionType: 'term' = 'term';
  public termType: 'literal' = 'literal';
  public category: C.DataTypeCategory;

  constructor(
    public typedValue: T,
    public strValue?: string,
    public dataType?: RDF.NamedNode,
    public language?: string) {
    super();
    this.category = C.categorize(dataType.value);
  }

  public toRDF(): RDF.Term {
    return RDFDM.literal(
      this.strValue || this.typedValue.toString(),
      this.language || this.dataType);
  }
}

export class NumericLiteral extends Literal<number> {
  public category: C.NumericTypeCategory;
  public coerceEBV(): boolean {
    return !!this.typedValue;
  }
}

export class BooleanLiteral extends Literal<boolean> {
  public coerceEBV(): boolean {
    return !!this.typedValue;
  }
}

export class DateTimeLiteral extends Literal<Date> { }

// https://www.w3.org/TR/2004/REC-rdf-concepts-20040210/#dfn-plain-literal
export class PlainLiteral extends Literal<string> {
  constructor(
    public typedValue: string,
    public strValue?: string,
    public language?: string) {
    super(typedValue, strValue, undefined, language);
    this.category = 'plain';
  }

  public coerceEBV(): boolean {
    return this.strValue.length !== 0;
  }
}

// https://www.w3.org/TR/sparql11-query/#defn_SimpleLiteral
export class SimpleLiteral extends PlainLiteral {
  public language?: undefined;
  public category: 'simple';

  constructor(
    public typedValue: string,
    public strValue?: string) {
    super(typedValue, strValue, undefined);
    this.category = 'simple';
  }

  public coerceEBV(): boolean {
    return this.strValue.length !== 0;
  }
}

export class StringLiteral extends Literal<string> {
  public coerceEBV(): boolean {
    return this.strValue.length !== 0;
  }
}

/*
 * This class is used when a literal is parsed, and it's value is
 * an invalid lexical form for it's datatype. The spec defines value with
 * invalid lexical form are still valid terms, and as such we can not error
 * immediately. This class makes sure that the typedValue will remain undefined,
 * and the category 'other'. This way, only when operators apply to the
 * 'other' category, they will keep working, otherwise they will throw a 
 * type error.
 * This seems to match the spec.
 *
 * See:
 *  - https://www.w3.org/TR/xquery/#dt-type-error
 *  - https://www.w3.org/TR/rdf-concepts/#section-Literal-Value
 *  - https://www.w3.org/TR/xquery/#dt-ebv
 *  - ... some other more precise thing i can't find...
 */
export class NonLexicalLiteral extends Literal<undefined> {
  constructor(
    typedValue: any,
    strValue?: string,
    dataType?: RDF.NamedNode,
    language?: string) {
    super(typedValue, strValue, dataType, language);
    this.typedValue = undefined;
    this.category = 'other';
  }
}
