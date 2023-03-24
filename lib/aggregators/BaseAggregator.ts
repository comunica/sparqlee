import type * as RDF from '@rdfjs/types';
import type { Algebra } from 'sparqlalgebrajs';
import type { ICompleteSharedContext } from '../evaluators/evaluatorHelpers/BaseExpressionEvaluator';
import type * as E from '../expressions';
import { TermTransformer } from '../transformers/TermTransformer';
import type { ITermTransformer } from '../transformers/TermTransformer';
import { TypeAlias } from '../util/Consts';
import { isSubTypeOf } from '../util/TypeHandling';

export interface IBaseState {
  seen: RDF.Term[];
}

export abstract class BaseAggregator<SubState> {
  protected distinct: boolean;
  protected separator: string;
  protected termTransformer: ITermTransformer;

  public constructor(expr: Algebra.AggregateExpression, protected sharedContext: ICompleteSharedContext) {
    this.distinct = expr.distinct;
    this.separator = expr.separator || ' ';
    this.termTransformer = new TermTransformer(sharedContext.superTypeProvider);
  }

  protected termToNumericOrError(term: RDF.Term): E.NumericLiteral {
    // TODO: Check behaviour
    if (term.termType !== 'Literal') {
      throw new Error(`Term with value ${term.value} has type ${term.termType} and is not a numeric literal`);
    } else if (
      !isSubTypeOf(term.datatype.value, TypeAlias.SPARQL_NUMERIC, this.sharedContext.superTypeProvider)
    ) {
      throw new Error(`Term datatype ${term.datatype.value} with value ${term.value} has type ${term.termType} and is not a numeric literal`);
    }
    return <E.NumericLiteral> this.termTransformer.transformLiteral(term);
  }

  protected extractValue(term: RDF.Term): { value: any; type: string } {
    if (term.termType !== 'Literal') {
      throw new Error(`Term with value ${term.value} has type ${term.termType} and is not a literal`);
    }

    const transformedLit = this.termTransformer.transformLiteral(term);
    return { type: transformedLit.dataType, value: transformedLit.typedValue };
  }

  public static emptyValue(): RDF.Term | undefined {
    return undefined;
  }

  protected abstract subInit(start: RDF.Term): SubState;
  protected abstract subPut(state: SubState, bindings: RDF.Term): SubState;
  protected abstract subResult(state: SubState): RDF.Term;

  public init(start: RDF.Term): IBaseState & { sub: SubState } {
    const subState: SubState = this.subInit(start);
    return {
      sub: subState,
      seen: this.addSeen([], start),
    };
  }

  public put(state: IBaseState & { sub: SubState }, bindings: RDF.Term): IBaseState & { sub: SubState } {
    if (this.canSkip(state, bindings)) {
      return state;
    }
    const sub: SubState = this.subPut(state.sub, bindings);
    return { sub, seen: this.addSeen(state.seen, bindings) };
  }

  public result(state: IBaseState & { sub: SubState }): RDF.Term {
    return this.subResult(state.sub);
  }

  protected canSkip(state: IBaseState, term: RDF.Term): boolean {
    return this.distinct && state.seen.some((t: RDF.Term) => t.equals(term));
  }

  protected addSeen(seen: RDF.Term[], term: RDF.Term): RDF.Term[] {
    return [ ...seen, term ];
  }
}
