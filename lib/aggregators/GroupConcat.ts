import type * as RDF from '@rdfjs/types';
import { string } from '../functions/Helpers';
import { SimpleAggregator } from './BaseAggregator';

export class GroupConcat extends SimpleAggregator<string> {
  public static emptyValue(): RDF.Term {
    return string('').toRDF();
  }

  public subInit(start: RDF.Term): string {
    return start.value;
  }

  public subPut(state: string, term: RDF.Term): string {
    return state + this.separator + term.value;
  }

  public subResult(state: string): RDF.Term {
    return string(state).toRDF();
  }
}
