import type * as RDF from '@rdfjs/types';
import type { Algebra } from 'sparqlalgebrajs';
import type { IApplyFunctionContext } from '../functions';
import type { SetFunction } from '../util/Consts';
import { Average } from './Average';
import type { BaseAggregator } from './BaseAggregator';
import { Count } from './Count';
import { GroupConcat } from './GroupConcat';
import { Max } from './Max';
import { Min } from './Min';
import { Sample } from './Sample';
import { Sum } from './Sum';

export interface IAggregatorClass {
  new(expr: Algebra.AggregateExpression, applyConfig: IApplyFunctionContext): BaseAggregator<any>;

  emptyValue: () => RDF.Term;
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
