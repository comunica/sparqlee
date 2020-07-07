import { orderTypes } from '../../lib/util/Consts';

describe('util/ordering', () => {
  describe('order', () => {
    test('same strings should be 0', () => {
        const result = orderTypes('"11"^^http://www.w3.org/2001/XMLSchema#string',
                                  '"11"^^http://www.w3.org/2001/XMLSchema#string',true);
        expect(result).toEqual(0);
    });
    test('string comparison', () => {
        const result = orderTypes('2',
                                  '11',true);
        expect(result).toEqual(1);
    });
    test('same integers should be 0', () => {
      const result = orderTypes('"2"^^http://www.w3.org/2001/XMLSchema#integer',
                                '"2"^^http://www.w3.org/2001/XMLSchema#integer',true);
      expect(result).toEqual(0);
    });
    test('strings should be sorted', () => {
        const result = orderTypes("ab","abb",true);
        expect(result).toEqual(-1);
    });
    test('integers should be sorted smaller', () => {
        const result = orderTypes('"2"^^http://www.w3.org/2001/XMLSchema#integer',
                                '"11"^^http://www.w3.org/2001/XMLSchema#integer',true);

        expect(result).toEqual(-1);
    });
    test('integers should be sorted larger', () => {
        const result = orderTypes('"11"^^http://www.w3.org/2001/XMLSchema#integer',
                                   '"2"^^http://www.w3.org/2001/XMLSchema#integer',true);

        expect(result).toEqual(1);
    });
    test('doubles should be sorted', () => {
        const result = orderTypes('"2.0e6"^^http://www.w3.org/2001/XMLSchema#double',
                                  '"11.0e6"^^http://www.w3.org/2001/XMLSchema#double',true);

        expect(result).toEqual(-1);
      });
    test('decimal should be sorted', () => {
    const result = orderTypes('"2"^^http://www.w3.org/2001/XMLSchema#decimal',
                                '"11"^^http://www.w3.org/2001/XMLSchema#decimal',true);
    expect(result).toEqual(-1);
    });
    test('float should be sorted', () => {
        const result = orderTypes('"2"^^http://www.w3.org/2001/XMLSchema#float',
                                    '"11"^^http://www.w3.org/2001/XMLSchema#float',true);

        expect(result).toEqual(-1);
    });
  });
});


