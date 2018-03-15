
import * as Promise from 'bluebird';

import { InvalidArity } from '../../util/Errors';
import { Bindings } from '../Bindings';
import { bl } from './Helpers';

import * as E from '../Expressions';

export type AsyncTerm = Promise<E.ITermExpression>;
export type Evaluator = (expr: E.IExpression, mapping: Bindings) => AsyncTerm;

// TODO: Might benefit from some smart people's input
export class LogicalOrAsync extends E.SpecialOperatorAsync {
  public apply(args: E.IExpression[], mapping: Bindings, evaluate: Evaluator): AsyncTerm {
    if (args.length !== 2) { throw new InvalidArity(args, this.operator); }
    const [left, right] = args;
    // TODO: Fix coercion error bug
    const wrap = (p: AsyncTerm) => p.then((term) => term.coerceEBV()).reflect();
    return Promise.join(
      wrap(evaluate(left, mapping)),
      wrap(evaluate(right, mapping)),
      (p1, p2) => {
        const r1 = p1.isRejected();
        const r2 = p2.isRejected();
        const f1 = p1.isFulfilled();
        const f2 = p2.isFulfilled();

        if (f1 && f2) { return bl(p1.value() || p2.value()); }

        if (r1 && r2) { throw p1.reason(); } // TODO: Might need to throw both

        const rejected = (r1) ? p1 : p2;
        const fullfilled = (f1) ? p1 : p2;

        if (fullfilled.value()) {
          return bl(true);
        } else {
          throw rejected.reason();
        }
      },
    );
  }
}

export class LogicalAndAsync extends E.SpecialOperatorAsync {
  public apply(args: E.IExpression[], mapping: Bindings, evaluate: Evaluator): AsyncTerm {
    if (args.length !== 2) { throw new InvalidArity(args, this.operator); }
    const [left, right] = args;
    const wrap = (p: AsyncTerm) => p.then((term) => term.coerceEBV()).reflect();
    return Promise.join(
      wrap(evaluate(left, mapping)),
      wrap(evaluate(right, mapping)),
      (p1, p2) => {
        const r1 = p1.isRejected();
        const r2 = p2.isRejected();
        const f1 = p1.isFulfilled();
        const f2 = p2.isFulfilled();

        if (f1 && f2) { return bl(p1.value() && p2.value()); }

        if (r1 && r2) { throw p1.reason(); } // TODO: Might need to throw both

        const rejected = (r1) ? p1 : p2;
        const fullfilled = (f1) ? p1 : p2;

        if (fullfilled.value()) {
          throw rejected.reason();
        } else {
          return bl(false);
        }
      },
    );
  }
}
