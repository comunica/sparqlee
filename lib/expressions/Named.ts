import type * as RDF from 'rdf-js';

import type { Expression,
  NamedExpression,
  SimpleApplication } from './Expressions';
import {
  ExpressionType,
} from './Expressions';

export class Named implements NamedExpression {
  expressionType: ExpressionType.Named = ExpressionType.Named;

  constructor(
    public name: RDF.NamedNode,
    public args: Expression[],
    public apply: SimpleApplication,
  ) { }
}
