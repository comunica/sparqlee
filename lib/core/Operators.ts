import * as RDF from 'rdf-data-model';

import { SimpleOperator, TermExpression, Expression, ArgumentType } from './Expressions';
import { Bindings as B } from '../FilteredStream';
import { UnimplementedError } from '../util/Errors';
import { NumericLiteral } from './Expressions';
import { DataTypeCategory, DataType as DT} from '../util/Consts';

export function makeSimpleOp(op: string, args: Expression[]): SimpleOperator {
  let opDef = simpleOps[op];
  // let cons: (result: any) => TermExpression = wrapInTerm(opDef.returnType);
  // let apply = (args: any[]): TermExpression => cons(opDef.apply(args));
  return new SimpleOperator(
    op,
    opDef.arity,
    args,
    opDef.types,
    apply
  );
}

interface OpDef {
  arity: number,
  types: ArgumentType[],
  // returnType: DataTypeCategory,
  apply(args: any[]): TermExpression,
}

interface SimpleOpMap { [key: string]: OpDef }

export const simpleOps: SimpleOpMap = {
  'UN_MIN': {
    arity: 1,
    // returnType: 'numeric',
    types: [makeArg('numeric')],
    apply: (args: NumericLiteral[]) => -args[0].typedValue,
  },
}

function makeArg(type: DataTypeCategory): ArgumentType {
  return { termType: 'Literal', literalType: type }
}

// function wrapInTerm(returnType: DataTypeCategory): (result: any) => TermExpression {
//   switch(returnType) {
//     case 'numeric':
//       return (result: number) => new NumericLiteral(
//         result,
//         undefined, // Let's not prematurely convert to strings
//         RDF.namedNode(DT.XSD_FLOAT)
//       );
//     case ''
//   }
//   throw new UnimplementedError();
// }