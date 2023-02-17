import { TypeURL } from '../util/Consts';
import type {
  IDateRepresentation,
  IDateTimeRepresentation, IDayTimeDurationRepresentation, IDurationRepresentation,
  ITimeRepresentation, IYearMonthDuration,
} from '../util/InternalRepresentations';
import { Literal } from './Term';

export class DateTimeLiteral extends Literal<IDateTimeRepresentation> {
  // StrValue is mandatory here because toISOString will always add
  // milliseconds, even if they were not present.
  public constructor(public typedValue: IDateTimeRepresentation, public strValue: string, dataType?: string) {
    super(typedValue, dataType || TypeURL.XSD_DATE_TIME, strValue);
  }
}

export class TimeLiteral extends Literal<ITimeRepresentation> {
  public constructor(public typedValue: ITimeRepresentation, public strValue: string, dataType?: string) {
    super(typedValue, dataType || TypeURL.XSD_TIME, strValue);
  }
}

export class DateLiteral extends Literal<IDateRepresentation> {
  public constructor(public typedValue: IDateRepresentation, public strValue: string, dataType?: string) {
    super(typedValue, dataType || TypeURL.XSD_DATE, strValue);
  }
}

export class DurationLiteral extends Literal<Partial<IDurationRepresentation>> {
  public constructor(public typedValue: Partial<IDurationRepresentation>, public strValue: string, dataType?: string) {
    super(typedValue, dataType || TypeURL.XSD_DURATION, strValue);
  }
}

export class YearMonthDurationLiteral extends Literal<Partial<IYearMonthDuration>> {
  public constructor(public typedValue: Partial<IYearMonthDuration>, public strValue: string, dataType?: string) {
    super(typedValue, dataType || TypeURL.XSD_YEAR_MONTH_DURATION, strValue);
  }
}

export class DayTimeDurationLiteral extends Literal<Partial<IDayTimeDurationRepresentation>> {
  public constructor(public typedValue: Partial<IDayTimeDurationRepresentation>, public strValue: string, dataType?: string) {
    super(typedValue, dataType || TypeURL.XSD_DAY_TIME_DURATION, strValue);
  }
}
