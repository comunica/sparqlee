import { Expression, ExpressionType, Term } from '../core/Expressions';
import {
  BooleanImpl, DateTimeImpl, Impl, ImplType, NumericImpl, SimpleImpl,
  StringImpl, TermImpl,
} from '../core/Operators';
import { BooleanLiteral, Literal, NumericLiteral } from '../core/Terms';
import { InvalidOperationError, UnimplementedError } from '../util/Errors';

// TODO: Maybe should be in core?
export interface IOperation extends Expression {
  operator: OpType;
  args: Expression[];
  apply(args: Term[]): Term;
}

export enum OpType {
  UN_PLUS,
  UN_MIN,
  NOT,
  AND,
  OR,
  EQUAL,
  NOTEQUAL,
  LT,
  GT,
  LTE,
  GTE,
  MULTIPLICATION,
  DIVISION,
  ADDITION,
  SUBTRACTION,
}

export abstract class BaseOperation implements IOperation {
  public operator: OpType;
  public exprType: ExpressionType.Operation = ExpressionType.Operation;
  public args: Expression[];
  private argNum: number;

  constructor(operator: OpType, args: Expression[], argNum: number) {
    this.args = args;
    this.argNum = argNum;
    this.operator = operator;
    if (args.length !== argNum) {
      throw new Error(`Incorrect number of arguments, was ${args.length} but should be 2`);
    }
  }

  public abstract apply(args: Term[]): Term;
}

export function getOp(op: OpType, args: Expression[]): IOperation {
  switch (op) {
    case OpType.UN_PLUS:
    case OpType.UN_MIN:
    case OpType.NOT: return new UnaryOperation(op, args);

    case OpType.AND:
    case OpType.OR:
    case OpType.EQUAL:
    case OpType.NOTEQUAL:
    case OpType.LT:
    case OpType.GT:
    case OpType.LTE:
    case OpType.GTE:
    case OpType.MULTIPLICATION:
    case OpType.DIVISION:
    case OpType.ADDITION:
    case OpType.SUBTRACTION: return new BinaryOperation(op, args);

    default: throw new UnimplementedError();
  }
}

// tslint:disable-next-line:max-classes-per-file
class UnaryOperation extends BaseOperation {
  public operator: OpType;

  private arg: Expression;
  private operation: ((arg: Term) => Term);

  constructor(operator: OpType, args: Expression[]) {
    super(operator, args, 1);
    this.arg = args[0];
    this.operation = unOpMap[operator];
  }

  public apply(args: Term[]): Term {
    return this.operation(args[0]);
  }
}

// tslint:disable-next-line:max-classes-per-file
class BinaryOperation extends BaseOperation {
  public operator: OpType;

  private left: Expression;
  private right: Expression;
  private operation: (impl: Impl) => ((left: Term, right: Term) => Term);

  constructor(operator: OpType, args: Expression[]) {
    super(operator, args, 2);
    this.left = args[0];
    this.right = args[1];
    this.operator = operator;
    this.operation = binOpMap[operator];
  }

  public apply(args: Term[]): Term {
    const type = `${args[0].implType} ${args[1].implType}`;
    const impl = typeMap.get(type);
    return this.operation(impl)(args[0], args[1]);
  }
}

// Bind unary operators the the correct method
// TODO: Maybe remove Impl requirement
type UnOp = (arg: Term) => Term;
interface IUnOpMap {
  [key: string]: UnOp;
}
const unOpMap: IUnOpMap = {
  [OpType.UN_PLUS]: (arg: Term) => new NumericLiteral(arg.unPlus()),
  [OpType.UN_MIN]: (arg: Term) => new NumericLiteral(arg.unMin()),
  [OpType.NOT]: (arg: Term) => new BooleanLiteral(arg.not()),
};

// Bind binary operators to the correct method
type BinOp = (left: Term, right: Term) => Term;
interface IBinOpMap {
  [key: string]: (impl: Impl) => BinOp;
}
const binOpMap: IBinOpMap = {
  // Boolean
  [OpType.AND]: (impl: Impl) => binBoolBinding(EBVAnd),
  [OpType.OR]: (impl: Impl) => binBoolBinding(EBVOr),
  [OpType.EQUAL]: (impl: Impl) => binBoolBinding(impl.rdfEqual),
  [OpType.NOTEQUAL]: (impl: Impl) => binBoolBinding(impl.rdfNotEqual),
  [OpType.LT]: (impl: Impl) => binBoolBinding(impl.lt),
  [OpType.GT]: (impl: Impl) => binBoolBinding(impl.gt),
  [OpType.LTE]: (impl: Impl) => binBoolBinding(impl.lte),
  [OpType.GTE]: (impl: Impl) => binBoolBinding(impl.gte),

  // Numeric
  [OpType.MULTIPLICATION]: (impl: Impl) => binNumBinding(impl.multiply),
  [OpType.DIVISION]: (impl: Impl) => binNumBinding(impl.divide),
  [OpType.ADDITION]: (impl: Impl) => binNumBinding(impl.multiply),
  [OpType.SUBTRACTION]: (impl: Impl) => binNumBinding(impl.subtract),
};

type NumOp = (left: Term, right: Term) => number;
function binNumBinding(op: NumOp): BinOp {
  return (left: Term, right: Term) => {
    return new NumericLiteral(op(left, right));
  };
}

type BoolOp = (left: Term, right: Term) => boolean;
function binBoolBinding(op: BoolOp): BinOp {
  return (left: Term, right: Term) => {
    return new BooleanLiteral(op(left, right));
  };
}

function EBVAnd(left: Term, right: Term): boolean {
  return left.toEBV() && right.toEBV();
}

function EBVOr(left: Term, right: Term) {
  return left.toEBV() || right.toEBV();
}

// Generate typeMap so no branching is needed;
// interface TypeKey { left: ImplType, right: ImplType }
type TypeKey = string;
const typeMap: Map<TypeKey, Impl> = (() => {
  const keyValues: [TypeKey, Impl][] = [];
  const term = new TermImpl();
  const num = new NumericImpl();
  const sim = new SimpleImpl();
  const str = new StringImpl();
  const bool = new BooleanImpl();
  const date = new DateTimeImpl();
  for (const t in ImplType) {
    for (const tt in ImplType) {
      const left: ImplType = (<any> ImplType)[t];
      const right: ImplType = (<any> ImplType)[tt];
      let impl: Impl = term;
      if (left === right) {
        switch (left) {
          case ImplType.Term: impl = term; break;
          case ImplType.Numeric: impl = num; break;
          case ImplType.Simple: impl = sim; break;
          case ImplType.String: impl = str; break;
          case ImplType.Boolean: impl = bool; break;
          case ImplType.DateTime: impl = date; break;
          default: throw Error("ImplType was somehow not defined");
        }
      }
      keyValues.push([`${left} ${right}`, impl]);
    }
  }
  return new Map(keyValues);
})();
