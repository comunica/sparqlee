import * as RDF from 'rdf-js';
import { Algebra } from 'sparqlalgebrajs';

import * as E from '../core/Expressions';

export class UnimplementedError extends Error {
  constructor() {
    super('Unimplemented feature!');
  }
}

export class InvalidLexicalForm extends Error {
  constructor(public args: RDF.Literal) {
    super('Invalid lexical form.');
  }
}

export class InvalidArity extends Error {
  constructor(public args: E.IExpression[], public op: string) {
    super('The amount of args don\'t match the arity of the operator.');
  }
}

export class InvalidArgumentTypes extends Error {
  constructor(public args: E.IExpression[], public op: string) {
    super("Argument types not valid for operator.");
  }
}
export class InvalidExpressionType extends Error {
  constructor(public expr: any) {
    super('The given expression type is not valid.');
  }
}

export class InvalidTermType extends Error {
  constructor(public term: Algebra.TermExpression) {
    super('The given term type is invalid.');
  }
}
