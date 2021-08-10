import type * as E from '../expressions';
import type { ArgumentType } from './Core';

export type SearchStack = OverloadNode[];

/**
 * Maps argument types on their specific implementation in a tree like structure.
 */
export class OverloadNode {
  private implementation?: E.SimpleApplication | undefined;
  private readonly subTrees: Record<string, OverloadNode>;

  public constructor() {
    this.implementation = undefined;
    this.subTrees = {};
  }

  /**
   * Adds an overload to the tree structure considering this as the tree's root.
   * @param argumentTypes a list of ArgumentTypes that would need to be provided in the same order to
   * get the implementation.
   * @param func the implementation for this overload.
   */
  public addOverload(argumentTypes: ArgumentType[], func: E.SimpleApplication): void {
    this._addOverload([ ...argumentTypes ], func);
  }

  private _addOverload(argumentTypes: ArgumentType[], func: E.SimpleApplication): void {
    const argument = argumentTypes.shift();
    if (!argument) {
      this.implementation = func;
      return;
    }
    const str = argument;
    if (!this.subTrees[str]) {
      this.subTrees[str] = new OverloadNode();
    }
    this.subTrees[str]._addOverload(argumentTypes, func);
  }

  /**
   * @param arg term to try and match to possible overloads of this node.
   * @returns SearchStack a stack with top element the next node that should be asked for implementation or overload.
   */
  public getSubTreeWithArg(arg: E.TermExpression): SearchStack {
    // The numbers a priority, a way to tell what type is more concrete and should be looked at first.
    const matching: [number, OverloadNode][] = [];
    for (const [ type, node ] of Object.entries(this.subTrees)) {
      if (type === (<any>arg).type) {
        matching.push([ 2, node ]);
      } else if (type === arg.termType) {
        matching.push([ 1, node ]);
      } else if (type === 'term') {
        matching.push([ 0, node ]);
      }
    }
    matching.sort(([ priorityA, nodeA ], [ priorityB, nodeB ]) => priorityA - priorityB);
    return matching.map(([ _, node ]) => node);
  }

  /**
   * Searches in a depth first way for the best matching overload. considering this a the tree's root.
   * @param args
   */
  public search(args: E.TermExpression[]): E.SimpleApplication | undefined {
    // SearchStack is a stack of all node's that need to be checked for implementation.
    // It provides an easy way to keep order in our search.
    const searchStack: { node: OverloadNode; index: number }[] = [];
    const startIndex = 0;
    // GetSubTreeWithArg return a SearchStack containing the node's that should be contacted next.
    // We also log the index since there is no other way to remember this index.
    // the provided stack should be pushed on top of our search stack since it also has it's order.
    searchStack.push(...this.getSubTreeWithArg(args[startIndex]).map(node =>
      ({ node, index: startIndex + 1 })));
    while (searchStack.length > 0) {
      const { index, node } = <{ node: OverloadNode; index: number }>searchStack.pop();
      if (index === args.length) {
        return node.getImplementation();
      }
      searchStack.push(...node.getSubTreeWithArg(args[index]).map(item =>
        ({ node: item, index: index + 1 })));
    }
    return this.getImplementation();
  }

  public getImplementation(): E.SimpleApplication | undefined {
    return this.implementation;
  }
}
