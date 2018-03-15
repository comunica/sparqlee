import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as RDF from 'rdf-js';
import { Algebra as Alg } from 'sparqlalgebrajs';

import { map } from 'benchmark';
import { Bindings } from '../core/Bindings';
import * as E from '../core/Expressions';
import { Literal } from '../core/Expressions';
import { makeOp } from '../core/OpDefinitions';
import { Lookup } from "../FromExpressionStream";
import { DataType as DT } from '../util/Consts';
import { InvalidExpressionType, InvalidTermType, UnimplementedError, InvalidLexicalForm } from '../util/Errors';
import * as P from '../util/Parsing';

export class AsyncEvaluator {
  private _expr: E.IExpression;
  private _lookup: Lookup;

  constructor(expr: Alg.Expression, lookup: Lookup) {
    this._expr = this._transform(expr);
    this._lookup = lookup;
  }

  public evaluate(mapping: Bindings): Promise<RDF.Term> {
    return this._eval(this._expr, mapping).then((val) => {
      return log(val).toRDF();
    });
  }

  public evaluateAsEBV(mapping: Bindings): Promise<boolean> {
    // let expr = new Promise<E.Expression>((res, rej) => res(this._expr));
    return this._eval(this._expr, mapping).then((val) => {
      return log(val).coerceEBV();
    });
  }

  private _eval(expr: E.IExpression, mapping: Bindings): Promise<E.ITermExpression> {
    const types = E.expressionTypes;
    switch (expr.expressionType) {
      case types.TERM:
        return Promise.resolve(<E.ITermExpression> expr);
      case types.VARIABLE:
        return Promise.try(() => (
          this._evalVar(<E.IVariableExpression> expr, mapping)
        ));
      case types.OPERATOR:
        return this._evalOp(<E.IOperatorExpression> expr, mapping);
      case types.NAMED:
        throw new UnimplementedError();
      case types.EXISTENCE:
        throw new UnimplementedError();
      case types.AGGREGATE:
        throw new UnimplementedError();
      default: throw new InvalidExpressionType(expr);
    }
  }

  private _evalVar(expr: E.IVariableExpression, mapping: Bindings): E.ITermExpression {
    const rdfTerm = mapping.get(expr.name);
    if (rdfTerm) {
      return <E.ITermExpression> this._transformTerm({
        type: 'expression',
        expressionType: 'term',
        term: rdfTerm,
      });
    } else {
      throw new TypeError("Unbound variable");
    }
  }

  private _evalOp(expr: E.IOperatorExpression, mapping: Bindings): Promise<E.ITermExpression> {
    switch (expr.operatorClass) {
      case 'simple': {
        const pArgs = expr.args.map((a) => this._eval(a, mapping));
        const op = <E.SimpleOperator> expr;
        return Promise.all(pArgs).then((args) => op.apply(args));
      }
      case 'overloaded': {
        const pArgs = expr.args.map((a) => this._eval(a, mapping));
        const op = <E.OverloadedOperator> expr;
        return Promise.all(pArgs).then((args) => op.apply(args));
      }
      case 'special': {
        const op = <E.SpecialOperatorAsync> expr;
        return op.apply(expr.args, mapping, this._eval.bind(this));
      }
      default: throw new TypeError("Unknown operator class.");
    }
  }

  private _transform(expr: Alg.Expression): E.IExpression {
    const types = Alg.expressionTypes;
    switch (expr.expressionType) {
      case types.TERM: return this._transformTerm(<Alg.TermExpression> expr);
      case types.OPERATOR: {
        const opIn = <Alg.OperatorExpression> expr;
        const args = opIn.args.map((a) => this._transform(a));
        // NOTE: If abstracted, sync and async should be differentiated
        return makeOp(opIn.operator, args);
      }
      case types.NAMED: throw new UnimplementedError();
      case types.EXISTENCE: throw new UnimplementedError();
      case types.AGGREGATE: throw new UnimplementedError();
      default: throw new InvalidExpressionType(expr);
    }
  }

  private _transformTerm(term: Alg.TermExpression): E.IExpression {
    switch (term.term.termType) {
      case 'Variable': return new E.Variable(term.term.value);
      case 'Literal': return this._tranformLiteral(<RDF.Literal> term.term);
      case 'NamedNode': throw new UnimplementedError();
      default: throw new InvalidTermType(term);
    }
  }

  private _tranformLiteral(lit: RDF.Literal): E.Literal<any> {
    switch (lit.datatype.value) {
      case null:
      case undefined:
      case "":
        return new E.Literal(lit.value, lit.value);

      case DT.XSD_STRING:
        return new E.StringLiteral(lit.value, lit.value, lit.datatype);
      case DT.RDF_LANG_STRING:
        return new E.StringLiteral(lit.value, lit.value, lit.datatype, lit.language);

      case DT.XSD_DATE_TIME: {
        const val: Date = new Date(lit.value);
        if (isNaN(val.getTime())) {
          throw new InvalidLexicalForm(lit);
        }
        return new E.DateTimeLiteral(new Date(lit.value), lit.value, lit.datatype);
      }

      case DT.XSD_BOOLEAN: {
        const val: boolean = JSON.parse(lit.value);
        // TODO: Fix: shouldn't error immediately, might require big changes
        // TODO: This might cause silent errors, and behaviour when typedVal
        // is undefined might be weird; Maybe errorType?
        // Advantage is, unless operator is defined for untyped literal,
        // it will raise a type error;
        if (typeof val !== 'boolean') {
          return new E.Literal<any>(val, lit.value, lit.datatype);
        }
        return new E.BooleanLiteral(val, lit.value, lit.datatype);
      }

      case DT.XSD_INTEGER:
      case DT.XSD_DECIMAL:

      case DT.XSD_NEGATIVE_INTEGER:
      case DT.XSD_NON_NEGATIVE_INTEGER:
      case DT.XSD_NON_POSITIVE_INTEGER:
      case DT.XSD_POSITIVE_INTEGER:
      case DT.XSD_LONG:
      case DT.XSD_INT:
      case DT.XSD_SHORT:
      case DT.XSD_BYTE:
      case DT.XSD_UNSIGNED_LONG:
      case DT.XSD_UNSIGNED_INT:
      case DT.XSD_UNSIGNED_SHORT:
      case DT.XSD_UNSIGNED_BYTE:
      case DT.XSD_INT: {
        const val: number = P.parseXSDInteger(lit.value);
        if (val === undefined) {
          return new E.Literal<any>(val, lit.value, lit.datatype);
        }
        return new E.NumericLiteral(val, lit.value, lit.datatype);
      }
      case DT.XSD_FLOAT:
      case DT.XSD_DOUBLE: {
        const val: number = P.parseXSDFloat(lit.value);
        if (val === undefined) {
          return new E.Literal<any>(val, lit.value, lit.datatype);
        }
        return new E.NumericLiteral(val, lit.value, lit.datatype);
      }
      default: return new E.Literal<string>(lit.value, lit.value, lit.datatype);
    }
  }
}

function log(val: any) {
  // console.log(val);
  return val;
}
