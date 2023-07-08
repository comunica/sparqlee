import type * as RDF from '@rdfjs/types';
import { orderTypes } from '../util/Ordering';
import { AggregatorComponent } from './Aggregator';

export class Min extends AggregatorComponent {
  private state: RDF.Term | undefined = undefined;

  public put(term: RDF.Term): void {
    this.doCheck(term);
    if (this.state === undefined) {
      this.state = term;
    } else if (orderTypes(this.state, term) === 1) {
      this.state = term;
    }
  }

  public result(): RDF.Term | undefined {
    if (this.state === undefined) {
      return Min.emptyValue();
    }
    return this.state;
  }
}
