import * as Promise from 'bluebird';
import { Map, Record } from 'immutable';

import * as C from '../../util/Consts';
import * as E from './../Expressions';
import * as Special from './SpecialFunctions';

import { UnimplementedError } from '../../util/Errors';

export function makeOp(op: string, args: E.IExpression[]): E.IOperatorExpression {
  if (!C.Operators.contains(op)) {
    throw new TypeError("Unknown operator");
  }

  const definitionMeta = definitions.get(<C.Operator> op);
  const { category, arity, definition } = definitionMeta;

  if (!definition) { throw new UnimplementedError(); }

  switch (category) {
    case 'simple': {
      const { types, apply } = <SimpleDefinition> definition;
      return new E.SimpleOperator(op, arity, args, types, apply);
    }
    case 'overloaded': {
      const overloadMap = <OverloadedDefinition> definition;
      return new E.OverloadedOperator(op, arity, args, overloadMap);
    }
    case 'special': {
      // tslint:disable-next-line:variable-name
      const SpecialOp = <SpecialDefinition> definition;
      return new SpecialOp(op, args);
    }
  }
}

interface IOperatorDefinition { }
type SpecificDefinition = SimpleDefinition | OverloadedDefinition | SpecialDefinition;
interface IDefinition {
  category: C.OperatorCategory;
  arity: number;
  definition: SpecificDefinition;
}

type IDefinitionMap = {[key in C.Operator]: IDefinition };

// tslint:disable-next-line:interface-over-type-literal
type SimpleDefinition = {
  types: E.ArgumentType[];
  apply(args: any[]): E.ITermExpression;
};

type OverloadedDefinition = E.OverloadMap;

type SpecialDefinition = new (op: string, args: E.IExpression[]) => E.IOperatorExpression;

const _definitions: IDefinitionMap = {
  '&&': {
    arity: 2,
    category: 'special',
    definition: Special.LogicalOrAsync,
  },
  '||': {
    arity: 2,
    category: 'special',
    definition: Special.LogicalAndAsync,
  },
};
const definitions = Map<C.Operator, IDefinition>(_definitions);
