import * as RDFJS from 'rdf-js';
import * as RDFDM from 'rdf-data-model';

import { ImplType } from './Operators';

export interface Expression {
    exprType: ExpressionType
}

// TODO: Convert to string enum for verbosity in debugging (currently ints)
export enum ExpressionType {
    Operation,
    FunctionCall,
    Aggregate,
    BGP,
    Group,
    Tuple,
    Variable,
    Term
}

// TODO: Make this an interface
export class VariableExpression implements Expression {
    exprType: ExpressionType.Variable = ExpressionType.Variable;
    name: string;
    
    constructor(name: string) {
        this.name = name;
    }

}

// TODO: Make this an interface
export class Tuple implements Expression {
    exprType: ExpressionType.Tuple = ExpressionType.Tuple;
    exprs: Expression[]

    constructor(exprs: Expression[]) {
        this.exprs = exprs;
    }
}

export interface Term extends Expression {
    exprType: ExpressionType;
    termType: TermType;
    implType: ImplType;

    toEBV(): boolean

    not(): boolean
    unPlus(): number
    unMin(): number

    toRDFJS(): RDFJS.Term
}

// RDFTerm = IRI, literal, blank node
// TODO: Maybe think about removing DefaultGraph

export enum TermType {
    NamedNode,
    BlankNode,
    Literal,
    DefaultGraph,
}