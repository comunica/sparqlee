// tslint:disable:object-literal-sort-keys
// tslint:disable:max-classes-per-file

import {DataFactory} from 'rdf-data-factory';
import * as RDF from 'rdf-js';

import { Algebra } from 'sparqlalgebrajs';

import * as E from '../expressions';
import * as C from '../util/Consts';
import * as Err from '../util/Errors';

import { regularFunctions } from '../functions';
import { number, string } from '../functions/Helpers';
import { Bindings } from '../Types';
import { parseXSDFloat } from '../util/Parsing';
import { SetFunction, TypeURL } from './../util/Consts';
import { SyncEvaluator, SyncEvaluatorConfig } from './SyncEvaluator';
import { transformLiteral } from '../Transformation';
import {AsyncEvaluator, AsyncEvaluatorConfig} from './AsyncEvaluator';

const DF = new DataFactory();

class BaseAggregateSupporter {
  protected expression: Algebra.AggregateExpression;
  protected aggregator: BaseAggregator<any>;
  protected throwError = false;
  protected state: any;

  constructor(expr: Algebra.AggregateExpression, throwError?: boolean) {
    this.expression = expr;
    this.aggregator = new aggregators[expr.aggregator as SetFunction](expr);
    this.throwError = throwError;
  }

  /**
   * The spec says to throw an error when a set function is called on an empty
   * set (unless explicitly mentioned otherwise like COUNT).
   * However, aggregate error handling says to not bind the result in case of an
   * error. So to simplify logic in the caller, we return undefined by default.
   *
   * @param throwError whether this function should respect the spec and throw an error if no empty value is defined
   */
  static emptyValue(expr: Algebra.AggregateExpression, throwError = false): RDF.Term {
    const val = aggregators[expr.aggregator as SetFunction].emptyValue();
    if (val === undefined && throwError) {
      throw new Err.EmptyAggregateError();
    }
    return val;
  }

  result(): RDF.Term {
    return (this.aggregator.constructor as AggregatorClass).emptyValue();
  }

  /**
   * Put a binding from the result stream in the aggregate state.
   *
   * If any binding evaluation errors, the corresponding aggregate variable should be unbound.
   * If this happens, calling @see result() will return @constant undefined
   *
   * @param term the term to pass to the expression
   */
  putTerm(term: RDF.Term): void {
    this.init(term);
  }

  /**
   * The actual put method. When the first binding has been given, and the state
   * of the evaluators initialised. The .put API function will be replaced with this
   * function, which implements the behaviour we want.
   *
   * @param term the term to pass to the expression
   */
  protected __putTerm(term: RDF.Term): void{
    try {
      this.state = this.aggregator.put(this.state, term);
    } catch (err) {
      this.safeThrow(err);
    }
  }

  /**
   * The actual result method. When the first binding has been given, and the state
   * of the evaluators initialised. The .result API function will be replaced with this
   * function, which implements the behaviour we want.
   *
   * @param bindings the bindings to pass to the expression
   */
  protected __result(): RDF.Term {
    return this.aggregator.result(this.state);
  }

  protected init(startTerm: RDF.Term): void {
    try {
      this.state = this.aggregator.init(startTerm);
      if (this.state) {
        this.putTerm = this.__putTerm;
        this.result = this.__result;
      }
    } catch (err) {
      this.safeThrow(err);
    }
  }

  protected safeThrow(err: Error): void {
    if (this.throwError) {
      throw err;
    } else {
      this.putTerm = () => { return; };
      this.result = () => undefined;
    }
  }
}

abstract class BaseAggregateEvaluator extends BaseAggregateSupporter {

  abstract evaluate(bindings: Bindings): RDF.Term | Promise<RDF.Term | undefined>;

  /**
   * Put a binding from the result stream in the aggregate state.
   *
   * If any binding evaluation errors, the corresponding aggregate variable should be unbound.
   * If this happens, calling @see result() will return @constant undefined
   *
   * @param bindings the bindings to pass to the expression
   */
  abstract put(bindings: Bindings): void | Promise<void>;

  /**
   * The actual put method. When the first binding has been given, and the state
   * of the evaluators initialised. The .put API function will be replaced with this
   * function, which implements the behaviour we want.
   *
   * @param bindings the bindings to pass to the expression
   */
  protected abstract __put(bindings: Bindings): void | Promise<void>;
}

// TODO: Support hooks & change name to SyncAggregateEvaluator
export class AggregateEvaluator extends BaseAggregateEvaluator{
  private evaluator: SyncEvaluator;

  constructor(expr: Algebra.AggregateExpression, config?: SyncEvaluatorConfig, throwError?: boolean) {
    super(expr, throwError);
    this.evaluator = new SyncEvaluator(expr.expression, config);
  }

  put(bindings: Bindings): void {
    this.initBindings(bindings);
  }

  evaluate(bindings: Bindings): RDF.Term | undefined {
    try {
      return this.evaluator.evaluate(bindings);
    } catch (err) {
      this.safeThrow(err);
    }
  }

  protected __put(bindings: Bindings): void {
    try {
      const term = this.evaluate(bindings);
      this.putTerm(term);
    } catch (err) {
      this.safeThrow(err);
    }
  }

  protected safeThrow(err: Error): void {
    if (this.throwError) {
      throw err;
    } else {
      this.put = () => { return; };
      this.putTerm = () => { return; };
      this.result = () => undefined;
    }
  }

  private initBindings(start: Bindings): void {
    try {
      const startTerm = this.evaluator.evaluate(start);
      if (! startTerm) return;
      this.init(startTerm);
      if (this.state) {
        this.put = this.__put;
      }
    } catch (err) {
      this.safeThrow(err);
    }
  }
}

export class AsyncAggregateEvaluator extends BaseAggregateEvaluator{
  private evaluator: AsyncEvaluator;
  private errorOccurred: boolean;

  constructor(expr: Algebra.AggregateExpression, config?: AsyncEvaluatorConfig, throwError?: boolean) {
    super(expr, throwError);
    this.evaluator = new AsyncEvaluator(expr.expression, config);
    this.errorOccurred = false;
  }

  evaluate(bindings: Bindings): Promise<RDF.Term | undefined> {
    try {
      return this.evaluator.evaluate(bindings);
    } catch (err) {
      this.safeThrow(err);
    }
  }

  put(bindings: Bindings): Promise<void> {
    return this.initBindings(bindings);
  }

  protected async __put(bindings: Bindings): Promise<void> {
    try {
      const term = await this.evaluate(bindings);
      this.putTerm(term);
    } catch (err) {
      this.safeThrow(err);
    }
  }

  protected safeThrow(err: Error): void {
    if (this.throwError) {
      throw err;
    } else {
      this.put = async () => { return; };
      this.putTerm = () => { return; };
      this.result = () => undefined;
      this.errorOccurred = true;
    }
  }

  private async initBindings(start: Bindings): Promise<void> {
    try {
      const startTerm = await this.evaluate(start);
      if (!startTerm || this.errorOccurred) return;
      if (this.state) {
        // Another put already initialized this, we should just handle the termPut and not init anymore
        return this.putTerm(startTerm);
      }
      this.init(startTerm);
      if (this.state) {
        this.put = this.__put;
      }
    } catch (err) {
      this.safeThrow(err);
    }
  }
}

export abstract class BaseAggregator<State> {
  protected distinct: boolean;
  protected separator: string;

  constructor(expr: Algebra.AggregateExpression) {
    this.distinct = expr.distinct;
    this.separator = expr.separator || ' ';
  }

  static emptyValue(): RDF.Term {
    return undefined;
  }

  abstract init(start: RDF.Term): State;

  abstract result(state: State): RDF.Term;

  abstract put(state: State, bindings: RDF.Term): State;

}

class Count extends BaseAggregator<number> {
  static emptyValue() {
    return number(0, TypeURL.XSD_INTEGER).toRDF();
  }

  init(start: RDF.Term): number {
    return 1;
  }

  put(state: number, term: RDF.Term): number {
    return state + 1;
  }

  result(state: number): RDF.Term {
    return number(state, TypeURL.XSD_INTEGER).toRDF();
  }
}

type SumState = E.NumericLiteral;
class Sum extends BaseAggregator<SumState> {
  summer = regularFunctions.get(C.RegularOperator.ADDITION);

  static emptyValue() {
    return number(0, TypeURL.XSD_INTEGER).toRDF();
  }

  init(start: RDF.Term): SumState {
    const { value, type } = extractNumericValueAndTypeOrError(start);
    return new E.NumericLiteral(value, DF.namedNode(type));
  }

  put(state: SumState, term: RDF.Term): SumState {
    const { value, type } = extractNumericValueAndTypeOrError(term);
    const internalTerm = new E.NumericLiteral(value, DF.namedNode(type));
    const sum = this.summer.apply([state, internalTerm]) as E.NumericLiteral;
    return sum;
  }

  result(state: SumState): RDF.Term {
    return state.toRDF();
  }
}

type ExtremeState = { extremeValue: number, term: RDF.Literal };
class Min extends BaseAggregator<ExtremeState> {
  init(start: RDF.Term): ExtremeState {
    const {value} = extractValue(null, start);
    if (start.termType === 'Literal') {
      return { extremeValue:value, term: start };
    }
  }

  put(state: ExtremeState, term: RDF.Term): ExtremeState {
    const extracted = extractValue(state.term, term);
    if (extracted.value < state.extremeValue && term.termType === 'Literal') {
      return {
        extremeValue: extracted.value ,
        term,
      };
    }
    return state;
  }

  result(state: ExtremeState): RDF.Term {
    return state.term;
  }
}

class Max extends BaseAggregator<ExtremeState> {
  init(start: RDF.Term): ExtremeState {
    const {value} = extractValue(null, start);
    if (start.termType === 'Literal') {
      return { extremeValue:value, term: start };
    }
  }

  put(state: ExtremeState, term: RDF.Term): ExtremeState {
    const extracted = extractValue(state.term, term);
    if (extracted.value > state.extremeValue && term.termType === 'Literal') {
      return {
        extremeValue: extracted.value ,
        term,
      };
    }
    return state;
  }

  result(state: ExtremeState): RDF.Term {
    return state.term;
  }
}

type AverageState = { sum: E.NumericLiteral, count: number };
class Average extends BaseAggregator<AverageState> {
  summer = regularFunctions.get(C.RegularOperator.ADDITION);
  divider = regularFunctions.get(C.RegularOperator.DIVISION);

  static emptyValue() {
    return number(0, TypeURL.XSD_INTEGER).toRDF();
  }

  init(start: RDF.Term): AverageState {
    const { value, type } = extractNumericValueAndTypeOrError(start);
    const sum = new E.NumericLiteral(value, DF.namedNode(type));
    return { sum, count: 1 };
  }

  put(state: AverageState, term: RDF.Term): AverageState {
    const { value, type } = extractNumericValueAndTypeOrError(term);
    const internalTerm = new E.NumericLiteral(value, DF.namedNode(type));
    const sum = this.summer.apply([state.sum, internalTerm]) as E.NumericLiteral;
    return {
      sum,
      count: state.count + 1,
    };
  }

  result(state: AverageState): RDF.Term {
    const count = new E.NumericLiteral(state.count, DF.namedNode(C.TypeURL.XSD_INTEGER));
    const result = this.divider.apply([state.sum, count]);
    return result.toRDF();
  }

}

class GroupConcat extends BaseAggregator<string> {
  static emptyValue() {
    return string('').toRDF();
  }

  init(start: RDF.Term): string {
    return start.value;
  }

  put(state: string, term: RDF.Term): string {
    return state + this.separator + term.value;
  }

  result(state: string): RDF.Term {
    return string(state).toRDF();
  }
}

class Sample extends BaseAggregator<RDF.Term> {
  init(start: RDF.Term): RDF.Term {
    return start;
  }

  put(state: RDF.Term, term: RDF.Term): RDF.Term {
    return state; // First value is our sample
  }

  result(state: RDF.Term): RDF.Term {
    return state;
  }
}

export interface AggregatorClass {
  new(expr: Algebra.AggregateExpression): BaseAggregator<any>;
  emptyValue(): RDF.Term;
}
export const aggregators: Readonly<{ [key in SetFunction]: AggregatorClass }> = {
  count: Count,
  sum: Sum,
  min: Min,
  max: Max,
  avg: Average,
  group_concat: GroupConcat,
  sample: Sample,
};

function extractNumericValueAndTypeOrError(term: RDF.Term): { value: number, type: C.NumericTypeURL } {
  // TODO: Check behaviour
  if (term.termType !== 'Literal') {
    throw new Error('Term with value ' + term.value + ' has type ' + term.termType +' and is not a numeric literal');
  } else if (!C.NumericTypeURLs.contains(term.datatype.value)) {
    throw new Error('Term datatype '+ term.datatype.value +' with value ' + term.value + ' has type ' + term.termType +' and is not a numeric literal');
  }

  const type: C.NumericTypeURL = term.datatype.value as unknown as C.NumericTypeURL;
  const value = parseXSDFloat(term.value);
  return { type, value };
}

function extractValue(extremeTerm: RDF.Literal, term: RDF.Term): {value: any, type:string}  {
  if (term.termType !== 'Literal') {
    throw new Error('Term with value ' + term.value + ' has type ' + term.termType +' and is not a literal');
  }

  const transformedLit = transformLiteral(term);
  return {type: transformedLit.typeURL.value, value: transformedLit.typedValue};
}
