import { Bindings, Lookup } from "../FilteredStream";
import { Algebra as Alg} from 'sparqlalgebrajs';
import * as rdfjs from 'rdf-js';
import * as Promise from 'bluebird';
import * as _ from 'lodash';

import { UnimplementedError, InvalidExpressionType, InvalidTermType } from '../util/Errors';
import * as E from '../core/Expressions';
import { Literal } from '../core/Expressions';
import { DataType as DT} from '../util/Consts';
import * as P from '../util/Parsing';
import { map } from 'benchmark';

export class AsyncEvaluator {
  private _expr: E.Expression;
  private _lookup: Lookup;

  constructor(expr: Alg.Expression, lookup: Lookup){
    this._expr = this._transform(expr);
    this._lookup = lookup;
  }

  public evaluate(mapping: Bindings): Promise<boolean> {
    // let expr = new Promise<E.Expression>((res, rej) => res(this._expr));
    return this._eval(this._expr, mapping).then(val => {
      return val.coerceEBV();
    });
  }

  private _eval(expr: E.Expression, mapping: Bindings): Promise<E.TermExpression> {
    return new Promise((res, rej) => {
      let types = E.expressionTypes;
      switch(expr.expressionType) {
        case types.TERM:
          return res(<E.TermExpression> expr);
        case types.VARIABLE:
          return res(this._evalVar(<E.VariableExpression> expr, mapping));
        case types.OPERATOR:
          return this._evalOp(<E.OperatorExpression> expr, mapping);
        case types.NAMED:
          throw new UnimplementedError();
        case types.EXISTENCE:
          throw new UnimplementedError();
        case types.AGGREGATE:
          throw new UnimplementedError();
        default: throw new InvalidExpressionType(expr);
      }
    });
  }

  private _evalVar(expr: E.VariableExpression, mapping: Bindings): E.TermExpression {
    let rdfTerm = mapping.get(expr.name);
    if (rdfTerm){
      return <E.TermExpression> this._transformTerm({
        type: 'expression',
        expressionType: 'term',
        term: rdfTerm
      });
    } else {
      throw new TypeError("Unbound variable");
    };
  }

  private _evalOp(expr: E.OperatorExpression, mapping: Bindings): Promise<E.TermExpression> {
    switch(expr.operatorClass) {
      case 'simple': {
        let pArgs = expr.args.map(a => this._eval(a, mapping));
        let op = <E.SimpleOperator> expr;
        return Promise.all(pArgs).then(args => op.apply(args));
      };
      case 'overloaded': {
        let op = <E.OverloadedOperator> expr;
        let left = this._eval(op.left, mapping), right = this._eval(op.right, mapping);
        return Promise.all([left, right]).then(args => op.apply(args[0], args[1]));
      };
      case 'special': throw new UnimplementedError();
      default: throw new TypeError("Unknown operator class.")
    }
  }

  private _transform(expr: Alg.Expression): E.Expression {
    let types = Alg.expressionTypes;
    switch (expr.expressionType) {
      case types.TERM: return this._transformTerm(<Alg.TermExpression> expr);
      case types.OPERATOR: throw new UnimplementedError();
      case types.NAMED: throw new UnimplementedError();
      case types.EXISTENCE: throw new UnimplementedError();
      case types.AGGREGATE: throw new UnimplementedError();
      default: throw new InvalidExpressionType(expr);
    }
  }

  private _transformTerm(term: Alg.TermExpression): E.Expression {
    switch(term.term.termType) {
      case 'Variable': return new E.Variable(term.term.value);
      case 'Literal': return this._tranformLiteral(<rdfjs.Literal> term.term);
      case 'NamedNode': throw new UnimplementedError();
      default: throw new InvalidTermType(term);
    }
  }

  private _tranformLiteral(lit: rdfjs.Literal): E.Literal<any> {
    switch (lit.datatype.value) {
      case null:
      case undefined:
      case "":
        return new E.Literal(lit.value, lit.value,);

      case DT.XSD_STRING: 
        return new E.Literal<string>(lit.value, lit.value, lit.datatype);
      case DT.RDF_LANG_STRING:
        return new E.Literal<string>(lit.value, lit.value, lit.datatype, lit.language);

      case DT.XSD_DATE_TIME: {
        const val: Date = new Date(lit.value);
        if (isNaN(val.getTime())) {
          throw new Error();
        }
        return new E.Literal<Date>(new Date(lit.value), lit.value, lit.datatype);
      }

      case DT.XSD_BOOLEAN: {
        const val: boolean = JSON.parse(lit.value);
        if (typeof val !== 'boolean') {
          throw new Error();
        }
        return new E.Literal<boolean>(val, lit.value, lit.datatype);
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
        if (val === undefined) { throw new TypeError(); }
        return new E.Literal<number>(val, lit.value, lit.datatype);
      }
      case DT.XSD_FLOAT:
      case DT.XSD_DOUBLE: {
        const val: number = P.parseXSDFloat(lit.value);
        if (val === undefined) { throw new TypeError(); }
        return new E.Literal<number>(val, lit.value, lit.datatype);
      }
      default: return new E.Literal<string>(lit.value, lit.value, lit.datatype);
    }
  }
}
