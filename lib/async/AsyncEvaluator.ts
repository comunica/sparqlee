import { Bindings } from "../FilteredStream";

export class AsyncEvaluator {
  public evaluate(mapping: Bindings): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      return resolve(true);
    });
  }
}
