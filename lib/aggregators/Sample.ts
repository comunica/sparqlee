import type * as RDF from '@rdfjs/types';
import { SimpleAggregator } from './BaseAggregator';

export class Sample extends SimpleAggregator<RDF.Term> {
  public subInit(start: RDF.Term): RDF.Term {
    return start;
  }

  public subPut(state: RDF.Term, term: RDF.Term): RDF.Term {
    // First value is our sample
    return state;
  }

  public subResult(state: RDF.Term): RDF.Term {
    return state;
  }
}
