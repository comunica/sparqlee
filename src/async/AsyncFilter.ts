// Imported as BPromise as to not shadow global Promise;
import * as BPromise from 'bluebird';
import * as S from 'sparqljs';

import {
  AbstractFilteredStream, Bindings, BindingsStream, IFilteredStream,
} from '../core/FilteredStreams';
import { UnimplementedError } from '../util/Errors';

export class ASyncFilter extends AbstractFilteredStream implements IFilteredStream {
  private evaluations: BPromise<void>[];

  constructor(expr: S.Expression, mappings: BindingsStream) {
    super(mappings);
  }

  public onInputData(mapping: Bindings): void {
    const evaluation = this
      .evaluate(mapping)
      .then((result) => {
        if (result === true) { this.emit('data', mapping); }
      })
      .catch((error) => {
        throw error;
      });
    this.evaluations.push(evaluation);
  }

  public onInputEnd(): void {
    BPromise
      .all(this.evaluations)
      .catch((error) => { throw error; })
      .finally(() => this.close());
  }

  public evaluate(mapping: Bindings): BPromise<boolean> {
    return new BPromise((resolve, reject) => {
      return resolve(true);
    });
  }
}
