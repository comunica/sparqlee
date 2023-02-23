import { rawTimeZoneExtractor } from '../../../lib/util/DateTimeHelpers';

describe('dateTimeHelpers', () => {
  describe('rawTimeZoneExtractor', () => {
    it('Throws an error if the zone can not be extracted', () => {
      expect(() => rawTimeZoneExtractor('apple')).toThrow();
    });
  });
});
