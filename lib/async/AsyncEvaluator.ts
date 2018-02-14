import { Bindings, Lookup } from "../FilteredStream";
import { Algebra as Alg} from 'sparqlalgebrajs';
import * as rdfjs from 'rdf-js';

import { UnimplementedError, InvalidExpressionType, InvalidTermType } from '../util/Errors';
import * as E from '../core/Expressions';
import { Literal } from '../core/Expressions';
import { DataType as DT} from '../util/Consts';
import * as P from '../util/Parsing';

export class AsyncEvaluator {
  private _expr: Alg.Expression;
  private _lookup: Lookup;

  constructor(expr: Alg.Expression, lookup: Lookup){
    this._expr = expr;
    this._lookup = lookup;
  }

  public evaluate(mapping: Bindings): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      return resolve(true);
    });
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

  private _eval(expr: Alg.Expression, mapping: Bindings): Alg.TermExpression {
    return undefined;
  }

  private _transformTerm(term: Alg.TermExpression): E.Expression {
    switch(term.term.termType) {
      case 'Variable': throw new UnimplementedError();
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
        return new E.Literal<Date>(lit.value, new Date(lit.value), lit.datatype);
      }

      case DT.XSD_BOOLEAN: {
        const val: boolean = JSON.parse(lit.value);
        if (typeof val !== 'boolean') {
          throw new Error();
        }
        return new E.Literal<boolean>(lit.value, val, lit.datatype);
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
        return new E.Literal<number>(lit.value, val, lit.datatype);
      }
      case DT.XSD_FLOAT:
      case DT.XSD_DOUBLE: {
        const val: number = P.parseXSDFloat(lit.value);
        if (val === undefined) { throw new TypeError(); }
        return new E.Literal<number>(lit.value, val, lit.datatype);
      }
      default: return new E.Literal<string>(lit.value, lit.value, lit.datatype);
    }
  }
}
