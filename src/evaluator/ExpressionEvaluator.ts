import * as RDF from 'rdf-data-model';
import { Expression } from "sparqljs";

import { Bindings } from "../core/Bindings";

export interface ExpressionEvaluator {
    evaluate(mapping: Bindings) :boolean;
}

export class AsyncEvaluator implements ExpressionEvaluator {
    expr: Expression;

    constructor(expr: Expression) {
        this.expr = expr;
    }

    evaluate(mapping: Bindings) :boolean {
        return true;
    }
}