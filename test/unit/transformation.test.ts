import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';

import { transformLiteral } from '../../lib/Transformation';
import { TypeURL as DT } from '../../lib/util/Consts';

function int(value: string): RDF.Literal {
  return DF.literal(value, DF.namedNode(DT.XSD_INTEGER));
}

function float(value: string): RDF.Literal {
  return DF.literal(value, DF.namedNode(DT.XSD_FLOAT));
}

function decimal(value: string): RDF.Literal {
  return DF.literal(value, DF.namedNode(DT.XSD_DECIMAL));
}

function double(value: string): RDF.Literal {
  return DF.literal(value, DF.namedNode(DT.XSD_DOUBLE));
}

const DF = new DataFactory();

describe('transformations', () => {
  describe('ordering literals', () => {
    it('invalid namedNode', () => {
      // No namednode, language is also not given
      const num = int('11');
      num.termType = undefined;
      const res = transformLiteral(num);
      expect(res.strValue).toEqual('11');
      expect(res.typedValue).toEqual(11);
      expect(res.language).toEqual(undefined);
      expect(res.dataType).toEqual(DT.XSD_INTEGER);
      // No namednode but language is given
      num.language = 'en';
      const res2 = transformLiteral(num);
      expect(res2.strValue).toEqual('11');
      expect(res2.typedValue).toEqual(11);
      expect(res2.language).toEqual(undefined);
      expect(res2.dataType).toEqual(DT.XSD_INTEGER);
    });

    it('integers type transform', () => {
      const num = int('11');
      const res = transformLiteral(num);
      expect(res.strValue).toEqual('11');
      expect(res.termType).toEqual('literal');
      expect(res.dataType).toEqual(DT.XSD_INTEGER);
      expect(res.typedValue).toEqual(11);
      expect(res.expressionType).toEqual('term');
    });

    it('double type transform', () => {
      const num = double('11');
      const res = transformLiteral(num);
      expect(res.strValue).toEqual('11');
      expect(res.termType).toEqual('literal');
      expect(res.dataType).toEqual(DT.XSD_DOUBLE);
      expect(res.typedValue).toEqual(11);
      expect(res.expressionType).toEqual('term');
    });
    it('decimal type transform', () => {
      const num = decimal('11');
      const res = transformLiteral(num);
      expect(res.strValue).toEqual('11');
      expect(res.termType).toEqual('literal');
      expect(res.dataType).toEqual(DT.XSD_DECIMAL);
      expect(res.typedValue).toEqual(11);
      expect(res.expressionType).toEqual('term');
    });

    it('float type transform', () => {
      const num = float('11');
      const res = transformLiteral(num);
      expect(res.strValue).toEqual('11');
      expect(res.termType).toEqual('literal');
      expect(res.dataType).toEqual(DT.XSD_FLOAT);
      expect(res.typedValue).toEqual(11);
      expect(res.expressionType).toEqual('term');
    });

    it('langString type transform', () => {
      const lit = DF.literal('ab', DT.RDF_LANG_STRING);
      const res = transformLiteral(lit);
      expect(res.strValue).toEqual('ab');
      expect(res.termType).toEqual('literal');
      expect(res.dataType).toEqual(DT.RDF_LANG_STRING);
      expect(res.typedValue).toEqual('ab');
      expect(res.expressionType).toEqual('term');
    });

    it('other type transform', () => {
      const lit = DF.literal('ab', 'othertype');
      const res = transformLiteral(lit);
      expect(res.strValue).toEqual('ab');
      expect(res.termType).toEqual('literal');
      expect(res.dataType).toEqual(DT.RDF_LANG_STRING);
      expect(res.typedValue).toEqual('ab');
      expect(res.expressionType).toEqual('term');
      expect(res.language).toEqual('othertype');
    });
  });
});

