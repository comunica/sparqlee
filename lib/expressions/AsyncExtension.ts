import type * as RDF from 'rdf-js';
import type { AsyncExtensionApplication, AsyncExtensionExpression, Expression } from './Expressions';
import { ExpressionType } from './Expressions';

export class AsyncExtension implements AsyncExtensionExpression {
  expressionType: ExpressionType.AsyncExtension = ExpressionType.AsyncExtension;

  constructor(
    public name: RDF.NamedNode,
    public args: Expression[],
    public apply: AsyncExtensionApplication,
  ) { }
}
