// Imported as BPromise as to not shadow global Promise;
import * as Promise from 'bluebird';
import { Algebra as Alg } from 'sparqlalgebrajs';

import { Bindings, BindingsStream, IFilteredStream, Lookup } from '../FilteredStream';
import { UnimplementedError } from '../util/Errors';
import { AsyncEvaluator } from './AsyncEvaluator';
import { BufferedIterator } from 'asynciterator';

export class AsyncFilter extends BufferedIterator<Bindings> implements IFilteredStream {

  private _expr: Alg.Expression;
  private _evaluator: AsyncEvaluator;
  private _input: BindingsStream;

  constructor(expr: Alg.Expression, input: BindingsStream, lookup: Lookup) {
    // Autostart false might be required to allow listening to error events in first pulls
    super({autoStart: false, maxBufferSize: 10}); 
    this._evaluator = new AsyncEvaluator(expr, lookup);
    this._input = input;
    this._input.on('end', () => {
      this.close();
    })
    Promise.longStackTraces();
  }

  public _read(count: number, done: () => void): void {
    let pushed = 0;
    let first = this._input.take(count);
    let evaluations: Promise<void>[] = [];

    first.on('data', (bindings) => {
      let evaluation = this._evaluate(bindings)
        .then((result) => { if (result === true){ this._push(bindings); }})
        .catch((error) => { this.emit('error', error);})
      evaluations.push(evaluation);
    });

    first.on('end', () => {
      Promise.all(evaluations)
        .then(() => done())
        .catch((error) => this.emit('error', error));
    });
  }

  // public async _evaluate(mapping: Bindings): Promise<boolean> {
  public _evaluate(mapping: Bindings): Promise<boolean> {
    return this._evaluator.evaluate(mapping);
  }
}
