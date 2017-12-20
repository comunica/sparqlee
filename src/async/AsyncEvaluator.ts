import { Evaluator, Bindings } from "../core/FilteredStreams";

export class AsyncEvaluator implements Evaluator {

    evaluate(mapping: Bindings): boolean {
        return true;
    }
}