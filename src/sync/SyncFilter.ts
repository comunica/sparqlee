import * as S from "sparqljs";

import {
  AbstractFilteredStream, Bindings, BindingsStream,
  IFilteredStream,
} from "../core/FilteredStreams";
import { UnimplementedError } from "../util/Errors";
import { SyncEvaluator } from "./SyncEvaluator";

export class SyncFilter extends AbstractFilteredStream implements IFilteredStream {
  private mappings: Bindings[];
  private evaluator: SyncEvaluator;
  private expr: S.Expression;

  constructor(expr: S.Expression, inputMappings: BindingsStream) {
    super(inputMappings);
    this.mappings = [];
    this.expr = expr;
  }

  public onInputData(mapping: Bindings): void {
    this.mappings.push(mapping);
  }

  public onInputEnd(): void {
    this.evaluator = new SyncEvaluator(this.expr);
    for (const mapping of this.mappings) {
      if (this.evaluate(mapping)) {
        this.emit('data', mapping);
      }
    }
    this.close();
  }

  public evaluate(mapping: Bindings): boolean {
    return this.evaluator.evaluate(mapping);
  }
}