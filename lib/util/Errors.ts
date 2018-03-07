import { Algebra } from 'sparqlalgebrajs';

export class UnimplementedError extends Error {
  constructor() {
    super("Unimplemented feature!");
  }
}

export class InvalidExpressionType extends Error {
  public expr: any;
  constructor(expr: any) {
    super("The given expression type is not valid");
    this.expr = expr;
  }
}

export class InvalidTermType extends Error {
  public term: Algebra.TermExpression;
  constructor(term: Algebra.TermExpression) {
    super("The given term type is invalid");
    this.term = term;
  }
}
