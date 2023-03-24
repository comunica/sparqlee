import type * as RDF from '@rdfjs/types';
import type { Algebra } from 'sparqlalgebrajs';
import type { ICompleteSharedContext } from '../evaluators/evaluatorHelpers/BaseExpressionEvaluator';
import type { SetFunction } from '../util/Consts';
import { Average } from './Average';
import type { SimpleAggregator } from './BaseAggregator';
import { Count } from './Count';
import { GroupConcat } from './GroupConcat';
import { Max } from './Max';
import { Min } from './Min';
import { Sample } from './Sample';
import { Sum } from './Sum';

export interface IAggregatorClass {
  new(expr: Algebra.AggregateExpression, sharedContext: ICompleteSharedContext): SimpleAggregator<any>;

  emptyValue: () => RDF.Term | undefined;
}

export const aggregators: Readonly<{[key in SetFunction]: IAggregatorClass }> = {
  count: Count,
  sum: Sum,
  min: Min,
  max: Max,
  avg: Average,
  group_concat: GroupConcat,
  sample: Sample,
};
