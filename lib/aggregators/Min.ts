import type * as RDF from '@rdfjs/types';
import { SimpleAggregator } from './BaseAggregator';

interface IExtremeState {
  extremeValue: number; term: RDF.Term;
}
export class Min extends SimpleAggregator<IExtremeState> {
  public subInit(start: RDF.Term): IExtremeState {
    const { value } = this.extractValue(start);
    return { extremeValue: value, term: start };
  }

  public subPut(state: IExtremeState, term: RDF.Term): IExtremeState {
    const extracted = this.extractValue(term);
    if (extracted.value < state.extremeValue) {
      return {
        extremeValue: extracted.value,
        term,
      };
    }
    return state;
  }

  public subResult(state: IExtremeState): RDF.Term {
    return state.term;
  }
}
