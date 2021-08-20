import type * as RDF from '@rdfjs/types';
import type * as LRUCache from 'lru-cache';
import type * as E from '../expressions';
import type { Bindings } from '../Types';
import type * as C from '../util/Consts';
import * as Err from '../util/Errors';
import type { IOpenWorldTyping } from '../util/TypeHandling';
import type { ImplementationFunction, OverloadTree } from './OverloadTree';

export interface IFunctionContext {
  openWorldType: IOpenWorldTyping;
  now: Date;
  baseIRI?: string;
}
export interface IApplyFunctionContext {
  functionContext: IFunctionContext;
  overloadCache?: LRUCache<string, string>;
}
export interface IEvalSharedContext extends IApplyFunctionContext{
  args: E.Expression[];
  mapping: Bindings;
}
export interface IEvalContext<Term, BNode> extends IEvalSharedContext {
  bnode: (input?: string) => BNode;
  evaluate: (expr: E.Expression, mapping: Bindings) => Term;
}

export type EvalContextAsync = IEvalContext<Promise<E.TermExpression>, Promise<RDF.BlankNode>>;
export type EvalContextSync = IEvalContext<E.TermExpression, RDF.BlankNode>;

// ----------------------------------------------------------------------------
// Overloaded Functions
// ----------------------------------------------------------------------------

// Function and operator arguments are 'flattened' in the SPARQL spec.
// If the argument is a literal, the datatype often also matters.
export type ArgumentType = 'term' | E.TermType | C.TypeURL | C.TypeAlias;

export interface IOverloadedDefinition {
  arity: number | number[];
  overloads: OverloadTree;
}

export abstract class BaseFunction<Operator> {
  public arity: number | number[];
  private readonly overloads: OverloadTree;

  protected constructor(public operator: Operator, definition: IOverloadedDefinition) {
    this.arity = definition.arity;
    this.overloads = definition.overloads;
  }

  /**
   * A function application works by monomorphing the function to a specific
   * instance depending on the runtime types. We then just apply this function
   * to the args.
   */
  public apply = (args: E.TermExpression[], applyConfig: IApplyFunctionContext):
  E.TermExpression => {
    const concreteFunction = this.monomorph(args, applyConfig) || this.handleInvalidTypes(args);
    return concreteFunction(applyConfig.functionContext)(args);
  };

  protected abstract handleInvalidTypes(args: E.TermExpression[]): never;

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
  private monomorph(args: E.TermExpression[], applyConfig: IApplyFunctionContext): ImplementationFunction | undefined {
    return this.overloads.search(
      args,
      applyConfig.functionContext.openWorldType,
      applyConfig.overloadCache,
    );
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

  protected handleInvalidTypes(args: E.TermExpression[]): never {
    throw new Err.InvalidArgumentTypes(args, this.operator);
  }
}

// Named Functions ------------------------------------------------------------
export class NamedFunction extends BaseFunction<C.NamedOperator> {
  protected functionClass: 'named' = 'named';

  public constructor(op: C.NamedOperator, definition: IOverloadedDefinition) {
    super(op, definition);
  }

  protected handleInvalidTypes(args: E.TermExpression[]): never {
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
