import { Algebra } from 'sparqlalgebrajs';

export class UnimplementedError extends Error {
  constructor() {
    super("Unimplemented feature!");
  }
}

export class InvalidExpressionType extends Error {
  expr: Algebra.Expression;
  constructor(expr: Algebra.Expression) {
    super("The given expression type is not valid");
    this.expr = expr;
  }
}

export class InvalidTermType extends Error {
  term: Algebra.TermExpression;
  constructor(term: Algebra.TermExpression) {
    super("The given term type is invalid");
    this.term = term;
  }
}
