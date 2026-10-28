import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { formatJalaliDate, getJalaliMonthRange, getJalaliWeekRange, parseJalaliDateInput } from './jalaliDate';
import _ from '@/lib/translate';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);
dayjs.extend(relativeTime);
dayjs.extend(quarterOfYear);
dayjs.extend(customParseFormat);

const FRAPPE_DATE_FORMAT = 'YYYY-MM-DD';
const getDocumentLocale = () => {
    const documentLocale = typeof document !== 'undefined' ? document.documentElement.lang : '';
    const frappeLocale = typeof window !== 'undefined'
        ? window.frappe?.boot?.lang || window.frappe?.boot?.user?.language
        : '';
    return documentLocale || frappeLocale || 'en';
};

export const isPersianLocale = () => /^fa(?:-|$)/i.test(getDocumentLocale());

export const getUserDateFormat = () =>
    window?.frappe?.boot?.user?.defaults?.date_format?.toUpperCase()
    || window?.frappe?.boot?.sysdefaults?.date_format?.toUpperCase()
    || FRAPPE_DATE_FORMAT;

export type TimePeriod = 'This Week' | 'This Month' | 'This Quarter' | 'This Year' | 'Last Week' | 'Last Month' | 'Last Quarter' | 'Last Year' | 'Date Range';

export const AVAILABLE_TIME_PERIODS: TimePeriod[] = [
    'This Month', 'This Week', 'This Quarter', 'This Year',
    'Last Week', 'Last Month', 'Last Quarter', 'Last Year',
];

const formatJalaliWeek = (date: dayjs.Dayjs, format: string, label: TimePeriod) => {
    const { from, to } = getJalaliWeekRange(date.toDate());
    return {
        fromDate: dayjs(from).format(format),
        toDate: dayjs(to).format(format),
        format: "Do MMM 'YY",
        translatedLabel: _(label),
    };
};

/** Return canonical Gregorian boundaries; Persian month/week periods use jalaali-js. */
export const getDatesForTimePeriod = (
    timePeriod: TimePeriod,
    format: string = FRAPPE_DATE_FORMAT,
    baseDate?: string,
) => {
    const date = baseDate ? dayjs(baseDate) : dayjs();
    const jalali = isPersianLocale();

    if (timePeriod === 'This Week') {
        if (jalali) return formatJalaliWeek(date, format, 'This Week');
        return {
            fromDate: date.startOf('week').format(format),
            toDate: date.endOf('week').format(format),
            format: "Do MMM 'YY",
            translatedLabel: _('This Week'),
        };
    }

    if (timePeriod === 'This Month' || timePeriod === 'Date Range') {
        if (jalali) {
            const range = getJalaliMonthRange(date.toDate());
            return {
                fromDate: dayjs(range.from).format(format),
                toDate: dayjs(range.to).format(format),
                format: "Do MMM 'YY",
                translatedLabel: _('This Month'),
            };
        }
        return {
            fromDate: date.startOf('month').format(format),
            toDate: date.endOf('month').format(format),
            format: "Do MMM 'YY",
            translatedLabel: _('This Month'),
        };
    }

    if (timePeriod === 'This Quarter') {
        return {
            fromDate: date.startOf('quarter').format(format),
            toDate: date.endOf('quarter').format(format),
            format: 'MMM YYYY',
            translatedLabel: _('This Quarter'),
        };
    }

    if (timePeriod === 'This Year') {
        return {
            fromDate: date.startOf('year').format(format),
            toDate: date.endOf('year').format(format),
            format: 'MMM YYYY',
            translatedLabel: _('This Year'),
        };
    }

    if (timePeriod === 'Last Week') {
        const previousWeek = date.subtract(1, 'week');
        if (jalali) return formatJalaliWeek(previousWeek, format, 'Last Week');
        return {
            fromDate: previousWeek.startOf('week').format(format),
            toDate: previousWeek.endOf('week').format(format),
            format: "Do MMM 'YY",
            translatedLabel: _('Last Week'),
        };
    }

    if (timePeriod === 'Last Month') {
        if (jalali) {
            const range = getJalaliMonthRange(date.toDate(), -1);
            return {
                fromDate: dayjs(range.from).format(format),
                toDate: dayjs(range.to).format(format),
                format: "Do MMM 'YY",
                translatedLabel: _('Last Month'),
            };
        }
        const previousMonth = date.subtract(1, 'month');
        return {
            fromDate: previousMonth.startOf('month').format(format),
            toDate: previousMonth.endOf('month').format(format),
            format: "Do MMM 'YY",
            translatedLabel: _('Last Month'),
        };
    }

    if (timePeriod === 'Last Quarter') {
        const previousQuarter = date.subtract(1, 'quarter');
        return {
            fromDate: previousQuarter.startOf('quarter').format(format),
            toDate: previousQuarter.endOf('quarter').format(format),
            format: 'MMM YYYY',
            translatedLabel: _('Last Quarter'),
        };
    }

    if (timePeriod === 'Last Year') {
        const previousYear = date.subtract(1, 'year');
        return {
            fromDate: previousYear.startOf('year').format(format),
            toDate: previousYear.endOf('year').format(format),
            format: 'MMM YYYY',
            translatedLabel: _('Last Year'),
        };
    }

    return { fromDate: '', toDate: '', format: 'Do MMM YY', translatedLabel: _('Date Range') };
};

const toUserTimezone = (timestamp: string) => {
    const systemTimezone = window.frappe?.boot?.time_zone?.system;
    const userTimezone = window.frappe?.boot?.time_zone?.user;
    return systemTimezone && userTimezone
        ? dayjs.tz(timestamp, systemTimezone).clone().tz(userTimezone)
        : dayjs(timestamp);
};

export const getTimeago = (date?: string) => date ? toUserTimezone(date).fromNow() : '';

/** Format a canonical Gregorian date for the active UI locale. */
export const formatDate = (date?: string | Date, format?: string) => {
    if (!date) return '';
    const outputFormat = format || getUserDateFormat();
    const parsed = dayjs(date);
    if (isPersianLocale() && parsed.isValid()) return formatJalaliDate(parsed.toDate(), outputFormat);
    return parsed.format(outputFormat);
};

/** Serialize a date for Frappe APIs and DB fields without locale conversion. */
export const formatCanonicalDate = (date: string | Date) => dayjs(date).format(FRAPPE_DATE_FORMAT);

export const toDate = (date: string, format: string = FRAPPE_DATE_FORMAT) => dayjs(date, format).toDate();

/** Parse dates typed in a Persian text field, returning a Gregorian Date for the model. */
export const parseDateInput = (value: string, format: string = getUserDateFormat()) => {
    if (!isPersianLocale()) return toDate(value, format);

    return parseJalaliDateInput(value, format);
};

export const today = () => dayjs().format(FRAPPE_DATE_FORMAT);
