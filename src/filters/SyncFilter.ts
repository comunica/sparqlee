import * as S from "sparqljs";

import { AbstractFilteredStream, FilteredStream } from "../core/FilteredStreams";
import { Bindings, BindingsStream } from "../core/Bindings";
import { UnimplementedError } from "../util/Errors";

export class SyncFilter extends AbstractFilteredStream implements FilteredStream {
    mappings: Bindings[];

    constructor(expr: S.Expression, inputMappings: BindingsStream) {
        super(inputMappings);
        this.mappings = [];
    }

    onInputData(mapping: Bindings): void {
        this.mappings.push(mapping);
    }

    onInputEnd(): void {
        for(let mapping of this.mappings) {
            if(this.evaluate(mapping)) {
                this.emit('data', mapping)
            }
        }
        this.close();
    }

    evaluate(mapping: Bindings): boolean {
        return true;
    }
}