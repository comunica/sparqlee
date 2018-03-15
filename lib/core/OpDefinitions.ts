// import * as Promise from 'bluebird';
// import { Map, Record } from 'immutable';
// import * as RDFDM from 'rdf-data-model';
// import * as RDF from 'rdf-js';

// import * as C from '../util/Consts';
// import { DataType as DT } from '../util/Consts';
// import { InvalidArgumentTypes, InvalidArity, UnimplementedError } from '../util/Errors';
// import { Bindings } from './Bindings';
// import * as E from './Expressions';

// export function makeOp(op: string, args: E.IExpression[]): E.IOperatorExpression {
//   if (!C.Operators.contains(op)) {
//     throw new TypeError("Unknown operator");
//   }

//   const definitionMeta = definitions.get(<C.Operator> op);
//   const { category, arity, definition } = definitionMeta;

//   if (!definition) { throw new UnimplementedError(); }

//   switch (category) {
//     case 'simple': {
//       const { types, apply } = <SimpleDefinition> definition;
//       return new E.SimpleOperator(op, arity, args, types, apply);
//     }
//     case 'overloaded': {
//       const overloadMap = <OverloadedDefinition> definition;
//       return new E.OverloadedOperator(op, arity, args, overloadMap);
//     }
//     case 'special': {
//       // tslint:disable-next-line:variable-name
//       const Special = <SpecialDefinition> definition;
//       return new Special(op, args);
//     }
//   }
// }

// interface IOperatorDefinition { }
// type SpecificDefinition = SimpleDefinition | OverloadedDefinition | SpecialDefinition;
// interface IDefinition {
//   category: C.OperatorCategory;
//   arity: number;
//   definition: SpecificDefinition;
// }

// type IDefinitionMap = {[key in C.Operator]: IDefinition };

// // tslint:disable-next-line:interface-over-type-literal
// type SimpleDefinition = {
//   types: E.ArgumentType[];
//   apply(args: any[]): E.ITermExpression;
// };

// type OverloadedDefinition = E.OverloadMap;

// type SpecialDefinition = new (op: string, args: E.IExpression[]) => E.IOperatorExpression;

// const definitions = Map<C.Operator, IDefinition>((() => _definitions)());
// const _definitions: IDefinitionMap = {
//   '&&': {
//     arity: 2,
//     category: 'special',
//     definition: LogicalOrAsync,
//   },
//   '||': {
//     arity: 2,
//     category: 'special',
//     definition: LogicalAndAsync,
//   },
// };


// ----------------------------------------------------------------------------
// Simple Operators
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Overloaded Operators
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Special Operators
// ----------------------------------------------------------------------------



// export function makeOp(op: string, args: E.IExpression[]): E.IOperatorExpression {
//   if (!C.Operators.contains(op)) {
//     throw new TypeError("Unknown operator");
//   }

//   if (!(<any> Object).values(C.Operator).includes(op)) {
//   }

//   if ((<any> Object).values(C.OverloadedOperator).includes(op)) {
//     return makeOverloadedOp(op, <E.ITermExpression[]> args);
//   }

//   if ((<any> Object).values(C.SpecialOperator).includes(op)) {
//     return makeSpecialOp(op, args);
//   }

//   return makeSimpleOp(op, <E.ITermExpression[]> args);
// }

// // -----------------------------------------------------------------------------

// export function makeSimpleOp(op: string, args: E.ITermExpression[]): E.SimpleOperator {
//   const opDef = simpleOps[op];
//   if (!opDef) {
//     throw new TypeError("Unknown operator");
//   }
//   return new E.SimpleOperator(
//     op,
//     opDef.arity,
//     args,
//     opDef.types,
//     opDef.apply,
//   );
// }

// interface ISimpleOpDef {
//   arity: number;
//   types: E.ArgumentType[];
//   // returnType: DataTypeCategory,
//   apply(args: any[]): E.ITermExpression;
// }

// interface ISimpleOpMap { [key: string]: ISimpleOpDef; }
// const simpleOps: ISimpleOpMap = {
//   // 'UMINUS': {
//   //   arity: 1,
//   //   types: [d('numeric')],
//   //   apply: (args: E.NumericLiteral[]) => nl(-args[0].typedValue),
//   // },
// }

// // -----------------------------------------------------------------------------

// function makeOverloadedOp(op: C.OverloadedOperator, args: E.ITermExpression[]): E.IOperatorExpression {
//   const opDef = overloadedOperators.get(op);
//   if (!opDef) { throw new TypeError("Unknown operator"); }

//   const operator = C.OverloadedOperator[op];
//   const { arity, overloadMap } = opDef;
//   return new E.OverloadedOperator(operator, arity, args, overloadMap);
// }

// interface IOverloadedOpDef {
//   arity: number;
//   overloadMap: E.OverloadMap;
// }

// // tslint:disable-next-line:variable-name
// const OverloadedOpDef = Record({ arity: 2, overloadMap: [] });
// type Operators = keyof typeof C.OverloadedOperator;
// type OverloadedOperatorMap = {[key in Operators]: IOverloadedOpDef };

// const _overloadedOperators: OverloadedOperatorMap = {
//   EQUAL: { arity: 2, overloadMap: undefined },
//   NOT_EQUAL: { arity: 2, overloadMap: undefined },
//   LT: { arity: 2, overloadMap: undefined },
//   GT: { arity: 2, overloadMap: undefined },
//   LTE: { arity: 2, overloadMap: undefined },
//   GTE: { arity: 2, overloadMap: undefined },

//   MULTIPLICATION: { arity: 2, overloadMap: undefined },
//   DIVISION: { arity: 2, overloadMap: undefined },
//   ADDITION: { arity: 2, overloadMap: undefined },
//   SUBTRACTION: { arity: 2, overloadMap: undefined },
// };

// const overloadedOperators = Map<C.OverloadedOperator, IOverloadedOpDef>(_overloadedOperators);

// // interface IOverloadedOpMap { [key: string]: IOverloadedOpDef; }

// // const overloadedOperators: IOverloadedOpMap = {
// //   '=': opEquality,
// //   '+': {
// //     arity: 2,
// //     overloadMap: []
// //       .concat(
// //         numericHelper((args: E.NumericLiteral[]) => {
// //           const result = args[0].typedValue + args[1].typedValue;
// //           return nl(result, C.decategorize(args[0].category));
// //         }),
// //     ),
// //   },
// // };

// // const opEquality = new OverloadedOpDef({
// //   arity: 2,
// //   overloadMap: []
// //     .concat(
// //       typeHelper('date', (args: E.DateTimeLiteral[]) => {
// //         throw new UnimplementedError();
// //       }))
// //     .concat(
// //       typeHelper('string', (args: E.StringLiteral[]) => {
// //         return bl(args[0].typedValue.localeCompare(args[0].typedValue) === 0);
// //       }))
// //     .concat(numericHelper(numEqual)),
// // });

// // function typeHelper(type: E.ArgumentType, func: OpFunc): E.OverloadMap {
// //   return [
// //     [[t(type), t(type)], func],
// //   ];
// // }

// // function numericHelper(func: (args: E.ITermExpression[]) => TE): E.OverloadMap {
// //   return [
// //     // TODO
// //     [[t('integer'), t('integer')], func],
// //     [[t('float'), t('float')], func],
// //   ];
// // }

// // function numEqual(args: E.NumericLiteral[]): TE {
// //   return bl(args[0].typedValue === args[1].typedValue);
// // }

// // // Again, type inference sucks
// // function concat(m1: E.OverloadMap, m2: E.OverloadMap): E.OverloadMap {
// //   return m1.concat(m2);
// // }

// // -----------------------------------------------------------------------------

// type AsyncTerm = Promise<E.ITermExpression>;
// type Evaluator = (expr: E.IExpression, mapping: Bindings) => AsyncTerm;

// function makeSpecialOp(op: string, args: E.IExpression[]): E.IOperatorExpression {
//   switch (op) {
//     case '||': return new LogicalOrAsync(op, args);
//     case '&&': return new LogicalAndAsync(op, args);
//   }
// }

// // TODO: Might benefit from some smart people's input
// class LogicalOrAsync extends E.SpecialOperatorAsync {
//   public apply(args: E.IExpression[], mapping: Bindings, evaluate: Evaluator): AsyncTerm {
//     if (args.length !== 2) { throw new InvalidArity(args, this.operator); }
//     const [left, right] = args;
//     const wrap = (p: AsyncTerm) => p.then((term) => term.coerceEBV()).reflect();
//     return Promise.join(
//       wrap(evaluate(left, mapping)),
//       wrap(evaluate(right, mapping)),
//       (p1, p2) => {
//         const r1 = p1.isRejected();
//         const r2 = p2.isRejected();
//         const f1 = p1.isFulfilled();
//         const f2 = p2.isFulfilled();

//         if (f1 && f2) { return bl(p1.value() || p2.value()); }

//         if (r1 && r2) { throw p1.reason(); } // TODO: Might need to throw both

//         const rejected = (r1) ? p1 : p2;
//         const fullfilled = (f1) ? p1 : p2;

//         if (fullfilled.value()) {
//           return bl(true);
//         } else {
//           throw rejected.reason();
//         }
//       },
//     );
//   }
// }

// class LogicalAndAsync extends E.SpecialOperatorAsync {
//   public apply(args: E.IExpression[], mapping: Bindings, evaluate: Evaluator): AsyncTerm {
//     if (args.length !== 2) { throw new InvalidArity(args, this.operator); }
//     const [left, right] = args;
//     const wrap = (p: AsyncTerm) => p.then((term) => term.coerceEBV()).reflect();
//     return Promise.join(
//       wrap(evaluate(left, mapping)),
//       wrap(evaluate(right, mapping)),
//       (p1, p2) => {
//         const r1 = p1.isRejected();
//         const r2 = p2.isRejected();
//         const f1 = p1.isFulfilled();
//         const f2 = p2.isFulfilled();

//         if (f1 && f2) { return bl(p1.value() && p2.value()); }

//         if (r1 && r2) { throw p1.reason(); } // TODO: Might need to throw both

//         const rejected = (r1) ? p1 : p2;
//         const fullfilled = (f1) ? p1 : p2;

//         if (fullfilled.value()) {
//           throw rejected.reason();
//         } else {
//           return bl(false);
//         }
//       },
//     );
//   }
// }

// // -----------------------------------------------------------------------------
// // Util
// // -----------------------------------------------------------------------------
// // TODO: Clean up
// type TE = E.ITermExpression;
// type OpFunc = (args: E.ITermExpression[]) => TE;

// function nl(val: number, type?: DT) {
//   return new E.NumericLiteral(val, undefined, RDFDM.namedNode(type || DT.XSD_FLOAT));
// }

// function bl(val: boolean) {
//   return new E.BooleanLiteral(val, undefined, RDFDM.namedNode(DT.XSD_BOOLEAN));
// }

// // Typescript inference sucks
// function t(i: E.ArgumentType): E.ArgumentType {
//   return i;
// }

// // Really fucking bad mans
// function f(func: (args: E.ITermExpression[]) => E.ITermExpression):
//   (args: E.ITermExpression[]) => E.ITermExpression {
//   return func;
// }
