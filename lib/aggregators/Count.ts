import type * as RDF from '@rdfjs/types';
import { integer } from '../functions/Helpers';
import { BaseAggregator } from './BaseAggregator';

export class Count extends BaseAggregator<number> {
  public static emptyValue(): RDF.Term {
    return integer(0).toRDF();
  }

  public subInit(start: RDF.Term): number {
    return 1;
  }

  public subPut(state: number, term: RDF.Term): number {
    return state + 1;
  }

  public subResult(state: number): RDF.Term {
    return integer(state).toRDF();
  }
}
