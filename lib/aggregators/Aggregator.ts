import type * as RDF from '@rdfjs/types';
import * as RdfString from 'rdf-string';
import type { Algebra } from 'sparqlalgebrajs';
import type { ICompleteSharedContext } from '../evaluators/evaluatorHelpers/BaseExpressionEvaluator';
import type * as E from '../expressions';
import { TermTransformer } from '../transformers/TermTransformer';
import type { ITermTransformer } from '../transformers/TermTransformer';
import { TypeAlias } from '../util/Consts';
import { isSubTypeOf } from '../util/TypeHandling';
import type { IAggregatorComponentClass } from '.';

export abstract class AggregatorComponent {
  public abstract put(bindings: RDF.Term | undefined): void;
  public abstract result(): RDF.Term | undefined;

  protected separator: string;
  protected termTransformer: ITermTransformer;

  public static emptyValue(): RDF.Term | undefined {
    return undefined;
  }

  public constructor(expr: Algebra.AggregateExpression, protected sharedContext: ICompleteSharedContext) {
    this.separator = expr.separator || ' ';
    this.termTransformer = new TermTransformer(sharedContext.superTypeProvider);
  }

  protected termToNumericOrError(term: RDF.Term): E.NumericLiteral {
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
}

/**
 * A base aggregator that can handle distinct and possibly wildcards.
 */
export class Aggregator {
  protected distinct: boolean;
  protected variableValues: Map<string, Set<string | undefined>> = new Map();

  public constructor(expr: Algebra.AggregateExpression, protected aggregatorComponent: AggregatorComponent) {
    this.distinct = expr.distinct;
  }

  public static emptyValue(component: IAggregatorComponentClass): RDF.Term | undefined {
    return component.emptyValue();
  }

  public result(): RDF.Term | undefined {
    return this.aggregatorComponent.result();
  }

  public put(bindings: RDF.Term | undefined, variable = ''): void {
    if (!this.canSkip(bindings, variable)) {
      this.aggregatorComponent.put(bindings);
      this.addSeen(bindings, variable);
    }
  }

  protected canSkip(term: RDF.Term | undefined, variable: string): boolean {
    const set = this.variableValues.get(variable);
    return this.distinct && !!set && set.has(term ? RdfString.termToString(term) : undefined);
  }

  protected addSeen(term: RDF.Term | undefined, variable: string): void {
    if (this.distinct) {
      if (!this.variableValues.has(variable)) {
        this.variableValues.set(variable, new Set());
      }
      this.variableValues.get(variable)!.add(term ? RdfString.termToString(term) : undefined);
    }
  }
}

/**
 * A base aggregator that handling wildcards and distinct.
 * Wildcards are handled by putting each term in the bindings in the aggregator component.
 */
export class WildcardAggregator extends Aggregator {
  public putBindings(bindings: RDF.Bindings): void {
    if (bindings.size === 0) {
      super.put(undefined, '');
    }
    for (const [ variable, key ] of bindings) {
      // No need to evaluate when wildcard is present. The specs say either an expression or a wildcard is present:
      // https://www.w3.org/TR/sparql11-query/#rAggregate
      super.put(key, variable.value);
    }
  }
}
