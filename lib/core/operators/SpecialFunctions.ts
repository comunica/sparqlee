
import * as Promise from 'bluebird';

import * as C from '../../util/Consts';
import {
  CoalesceError, InvalidArgumentTypes, InvalidArity, UnimplementedError, InError,
} from '../../util/Errors';
import { Bindings } from '../Bindings';
import { makeOp } from './Definitions';
import { bool } from './Helpers';

import * as E from '../Expressions';

export type AsyncTerm = Promise<E.ITermExpression>;
export type Evaluator = (expr: E.IExpression, mapping: Bindings) => AsyncTerm;

export class Bound extends E.SpecialOperatorAsync {
  public apply(args: E.IExpression[], mapping: Bindings, evaluate: Evaluator): AsyncTerm {
    const variable = args[0] as E.IVariableExpression;
    if (variable.expressionType !== 'variable') {
      throw new InvalidArgumentTypes(args, C.Operator.BOUND);
    }
    const val = mapping.has(variable.name) && !!mapping.get(variable.name);
    return Promise.resolve(bool(val));
  }
}

export class If extends E.SpecialOperatorAsync {
  public apply(args: E.IExpression[], mapping: Bindings, evaluate: Evaluator): AsyncTerm {
    const valFirstP = evaluate(args[0], mapping);
    return valFirstP.then((valFirst) => {
      const ebv = valFirst.coerceEBV();
      return (ebv)
        ? evaluate(args[1], mapping)
        : evaluate(args[2], mapping);
    });
  }
}

export class Coalesce extends E.SpecialOperatorAsync {
  public apply(args: E.IExpression[], mapping: Bindings, evaluate: Evaluator): AsyncTerm {
    return Promise
      .mapSeries(args, (expr) =>
        evaluate(expr, mapping)
          .then((term) => new CoalesceBreaker(term))
          .catch((err) => new CoalesceContinuer(err))
          .then((controller) => {
            if (controller.type === 'breaker') {
              throw controller;
            } else {
              return controller;
            }
          }))
      .map((continuer: CoalesceContinuer) => continuer.err)
      .then((errors) => { throw new CoalesceError(errors); })
      .catch(CoalesceBreaker, (br) => {
        return br.val;
      });
  }
}

// tslint:disable-next-line:interface-over-type-literal
type CoalesceController = { type: 'breaker' | 'continuer' };
class CoalesceBreaker extends Error implements CoalesceController {
  public type: 'breaker' = 'breaker';
  constructor(public val: E.ITermExpression) {
    super();
  }
}
class CoalesceContinuer implements CoalesceController {
  public type: 'continuer' = 'continuer';
  constructor(public err: Error) { }
}

// TODO: Might benefit from some smart people's input
// https://www.w3.org/TR/sparql11-query/#func-logical-or
export class LogicalOrAsync extends E.SpecialOperatorAsync {
  public apply(args: E.IExpression[], mapping: Bindings, evaluate: Evaluator): AsyncTerm {
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

        if (f1 && f2) { return bool(p1.value() || p2.value()); }

        if (r1 && r2) { throw p1.reason(); } // TODO: Might need to throw both

        const rejected = (r1) ? p1 : p2;
        const fullfilled = (f1) ? p1 : p2;

        if (fullfilled.value()) {
          return bool(true);
        } else {
          throw rejected.reason();
        }
      },
    );
  }
}

// https://www.w3.org/TR/sparql11-query/#func-logical-and
export class LogicalAndAsync extends E.SpecialOperatorAsync {
  public apply(args: E.IExpression[], mapping: Bindings, evaluate: Evaluator): AsyncTerm {
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

        if (f1 && f2) { return bool(p1.value() && p2.value()); }

        if (r1 && r2) { throw p1.reason(); } // TODO: Might need to throw both

        const rejected = (r1) ? p1 : p2;
        const fullfilled = (f1) ? p1 : p2;

        if (fullfilled.value()) {
          throw rejected.reason();
        } else {
          return bool(false);
        }
      },
    );
  }
}

export class In extends E.SpecialOperatorAsync {
  public apply(args: E.IExpression[], mapping: Bindings, evaluate: Evaluator): AsyncTerm {
    if (args.length < 1) { throw new InvalidArity(args, C.Operator.IN); }
    const [left, ...remaining] = args;
    const thunks = remaining.map((expr) => () => evaluate(expr, mapping));
    return evaluate(left, mapping)
      .then((_left) => inR(_left, thunks, []));
  }
}

function inR(left: E.ITermExpression, args: (() => AsyncTerm)[], results: (Error | false)[]): AsyncTerm {
  if (args.length === 0) {
    return (results.every((v) => !v))
      ? Promise.resolve(bool(false))
      : Promise.reject(new InError(results));
  }
  const first = args.shift();
  return first()
    .then((v) => {
      const op = makeOp('=', [left, left]) as E.OverloadedOperator;
      return op.apply([left, v]);
    })
    .then(
      (result) => ((result as E.BooleanLiteral).typedValue)
        ? bool(true)
        : inR(left, args, [...results, false]),
      (err) => inR(left, args, [...results, err]),
  );
}

// export class In extends E.SpecialOperatorAsync {
//   public apply(args: E.IExpression[], mapping: Bindings, evaluate: Evaluator): AsyncTerm {
//     if (args.length < 1) { throw new InvalidArity(args, C.Operator.IN); }
//     const [_left, ..._exprList] = args;
//     return evaluate(_left, mapping)
//       .then((left) => {
//         const pExrList = _exprList.map((expr) => evaluate(expr, mapping));
//         return Promise
//           .all(pExrList)
//           .map((expr: E.IExpression) => evaluate(expr, mapping))
//           .map((term: E.ITermExpression) => {
//             const op = makeOp('=', [_left, term]) as E.OverloadedOperator;
//             return Promise
//               .try(() => op.apply([left, term]))
//               .then((result: E.ITermExpression) => {
//                 return ((result as E.BooleanLiteral).typedValue)
//                   ? new InBreakerTrue()
//                   : new InContinuerFalse();
//               })
//               .catch((err) => new InContinuerError(err));
//           });
//       })
//       .then((controllers: InController[]) => {
//         if (controllers.some((c) => c.type === 'continuerError')) {
//           throw new InError(controllers.map((c) => {
//             return (c.type === 'continuerError')
//               ? (c as InContinuerError).err
//               : false;
//           }));
//         }
//       })
//       .then(() => bool(false))
//       .catch(InBreakerTrue, () => bool(true));
//   }
// }

// tslint:disable-next-line:interface-over-type-literal
type InController = { type: 'breaker' | 'continuerFalse' | 'continuerError' };
class InBreakerTrue extends Error implements InController {
  public type: 'breaker' = 'breaker';
  constructor() { super(); }
}
class InContinuerFalse implements InController {
  public type: 'continuerFalse';
}
class InContinuerError implements InController {
  public type: 'continuerError' = 'continuerError';
  constructor(public err: Error) { }
}

export class NotIn extends E.SpecialOperatorAsync {
  public apply(args: E.IExpression[], mapping: Bindings, evaluate: Evaluator): AsyncTerm {
    return new In(C.Operator.IN, args)
      .apply(args, mapping, evaluate)
      .then((term: E.ITermExpression) => (term as E.BooleanLiteral).typedValue)
      .then((isIn) => bool(!isIn));
  }
}