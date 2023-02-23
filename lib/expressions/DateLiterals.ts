import { TypeURL } from '../util/Consts';
import { dateSerializer, dateTimeSerializer, durationSerializer, timeSerializer } from '../util/DateTimeHelpers';
import type {
  IDateRepresentation,
  IDateTimeRepresentation, IDurationRepresentation,
  ITimeRepresentation, IYearMonthDurationRepresentation,
} from '../util/InternalRepresentations';
import { Literal } from './Term';

export class DateTimeLiteral extends Literal<IDateTimeRepresentation> {
  public constructor(public typedValue: IDateTimeRepresentation, public strValue?: string, dataType?: string) {
    super(typedValue, dataType || TypeURL.XSD_DATE_TIME, strValue);
  }

  public str(): string {
    return dateTimeSerializer(this.typedValue);
  }
}

export class TimeLiteral extends Literal<ITimeRepresentation> {
  public constructor(public typedValue: ITimeRepresentation, public strValue?: string, dataType?: string) {
    super(typedValue, dataType || TypeURL.XSD_TIME, strValue);
  }

  public str(): string {
    return timeSerializer(this.typedValue);
  }
}

export class DateLiteral extends Literal<IDateRepresentation> {
  public constructor(public typedValue: IDateRepresentation, public strValue?: string, dataType?: string) {
    super(typedValue, dataType || TypeURL.XSD_DATE, strValue);
  }

  public str(): string {
    return dateSerializer(this.typedValue);
  }
}

export class DurationLiteral extends Literal<Partial<IDurationRepresentation>> {
  public constructor(public typedValue: Partial<IDurationRepresentation>, public strValue?: string, dataType?: string) {
    super(typedValue, dataType || TypeURL.XSD_DURATION, strValue);
  }

  public str(): string {
    return durationSerializer(this.typedValue);
  }
}

export class DayTimeDurationLiteral extends DurationLiteral {
  public constructor(public typedValue: Partial<IDurationRepresentation>, public strValue?: string, dataType?: string) {
    super(typedValue, strValue, dataType || TypeURL.XSD_DAY_TIME_DURATION);
  }
}

export class YearMonthDurationLiteral extends Literal<Partial<IYearMonthDurationRepresentation>> {
  public constructor(public typedValue: Partial<IYearMonthDurationRepresentation>, public strValue?: string,
    dataType?: string) {
    super(typedValue, dataType || TypeURL.XSD_YEAR_MONTH_DURATION, strValue);
  }

  public str(): string {
    return durationSerializer(this.typedValue, 'P0M');
  }
}
