import { Expression } from 'sparqljs';
import { Literal } from 'rdf-js';
import { ExpressionEvaluator } from '../src/evaluator/ExpressionEvaluator';
import { Bindings } from "../src/core/Bindings";


/**
 * Benchmarking this provides a (very lose) theoretical maximum
 */
export class EmptyEvaluator implements ExpressionEvaluator {
    expr: Expression;

    constructor(expr: Expression) {
        this.expr = expr;
    }

    evaluate(mapping: Bindings) :boolean {
        return null;
    }
}
