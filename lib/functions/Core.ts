import type * as E from '../expressions';
import type * as C from '../util/Consts';
import * as Err from '../util/Errors';
import type { OverloadNode } from './OverloadNode';

type Term = E.TermExpression;

// ----------------------------------------------------------------------------
// Overloaded Functions
// ----------------------------------------------------------------------------

// Function and operator arguments are 'flattened' in the SPARQL spec.
// If the argument is a literal, the datatype often also matters.
export type ArgumentType = 'term' | E.TermType | C.Type;

export interface IOverloadedDefinition {
  arity: number | number[];
  overloads: OverloadNode;
}

export abstract class BaseFunction<Operator> {
  public arity: number | number[];
  private readonly overloads: OverloadNode;

  protected constructor(public operator: Operator, definition: IOverloadedDefinition) {
    this.arity = definition.arity;
    this.overloads = definition.overloads;
  }

  /**
   * A function application works by monomorphing the function to a specific
   * instance depending on the runtime types. We then just apply this function
   * to the args.
   */
  public apply = (args: Term[]): Term => {
    const concreteFunction = this.monomorph(args) || this.handleInvalidTypes(args);
    return concreteFunction(args);
  };

  protected abstract handleInvalidTypes(args: Term[]): never;

  /**
   * We monomorph by checking the map of overloads for keys corresponding
   * to the runtime types. We start by checking for an implementation for the
   * most concrete types (integer, string, date, IRI), if we find none,
   * we consider their term types (literal, blank, IRI), and lastly we consider
   * all arguments as generic terms.
   *
   * Another option would be to populate the overloads with an implementation
   * for every concrete type when the function is generic over termtypes or
   * terms.
   */
  private monomorph(args: Term[]): E.SimpleApplication | undefined {
    return this.overloads.search(args);
  }
}

// Regular Functions ----------------------------------------------------------

/**
 * Varying kinds of functions take arguments of different types on which the
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
 * See also: https://www.w3.org/TR/sparql11-query/#func-rdfTerms
 * and https://www.w3.org/TR/sparql11-query/#OperatorMapping
 */
export class RegularFunction extends BaseFunction<C.RegularOperator> {
  protected functionClass: 'regular' = 'regular';

  public constructor(op: C.RegularOperator, definition: IOverloadedDefinition) {
    super(op, definition);
  }

  protected handleInvalidTypes(args: Term[]): never {
    throw new Err.InvalidArgumentTypes(args, this.operator);
  }
}

// Named Functions ------------------------------------------------------------
export class NamedFunction extends BaseFunction<C.NamedOperator> {
  protected functionClass: 'named' = 'named';

  public constructor(op: C.NamedOperator, definition: IOverloadedDefinition) {
    super(op, definition);
  }

  protected handleInvalidTypes(args: Term[]): never {
    throw new Err.InvalidArgumentTypes(args, this.operator);
  }
}

// Special Functions ----------------------------------------------------------
/**
 * Special Functions are those that don't really fit in sensible categories and
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
export class SpecialFunction {
  public functionClass: 'special' = 'special';
  public arity: number;
  public applySync: E.SpecialApplicationSync;
  public applyAsync: E.SpecialApplicationAsync;
  public checkArity: (args: E.Expression[]) => boolean;

  public constructor(public operator: C.SpecialOperator, definition: ISpecialDefinition) {
    this.arity = definition.arity;
    this.applySync = definition.applySync;
    this.applyAsync = definition.applyAsync;
    this.checkArity = definition.checkArity || defaultArityCheck(this.arity);
  }
}

function defaultArityCheck(arity: number): (args: E.Expression[]) => boolean {
  return (args: E.Expression[]): boolean => {
    // Infinity is used to represent var-args, so it's always correct.
    if (arity === Number.POSITIVE_INFINITY) {
      return true;
    }

    // If the function has overloaded arity, the actual arity needs to be present.
    if (Array.isArray(arity)) {
      return arity.includes(args.length);
    }

    return args.length === arity;
  };
}

export interface ISpecialDefinition {
  arity: number;
  applyAsync: E.SpecialApplicationAsync;
  applySync: E.SpecialApplicationSync;
  checkArity?: (args: E.Expression[]) => boolean;
}

// Type Promotion -------------------------------------------------------------

const _promote: {[t in C.PrimitiveNumericType]: {[tt in C.PrimitiveNumericType]: C.PrimitiveNumericType }} = {
  integer: {
    integer: 'integer',
    decimal: 'decimal',
    float: 'float',
    double: 'double',
  },
  decimal: {
    integer: 'decimal',
    decimal: 'decimal',
    float: 'float',
    double: 'double',
  },
  float: {
    integer: 'float',
    decimal: 'float',
    float: 'float',
    double: 'double',
  },
  double: {
    integer: 'double',
    decimal: 'double',
    float: 'double',
    double: 'double',
  },
};

export function promote(left: C.PrimitiveNumericType, right: C.PrimitiveNumericType): C.PrimitiveNumericType {
  return _promote[left][right];
}
