import {AsyncExtensionApplication, AsyncExtensionExpression, Expression, ExpressionType} from './Expressions';
import * as RDF from 'rdf-js';

export class AsyncExtension implements AsyncExtensionExpression {
  expressionType: ExpressionType.AsyncExpression = ExpressionType.AsyncExpression;

  constructor(
    public name: RDF.NamedNode,
    public args: Expression[],
    public apply: AsyncExtensionApplication) { }
}
