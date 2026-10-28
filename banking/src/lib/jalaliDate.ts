import { digitsArToFa, digitsFaToEn } from '@persian-tools/persian-tools';
import { isValidJalaaliDate, jalaaliMonthLength, jalaaliWeek, toGregorian, toJalaali } from 'jalaali-js';

const PERSIAN_MONTH_NAMES = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];
export const JALALI_MONTH_NAMES = PERSIAN_MONTH_NAMES;
export const JALALI_WEEKDAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

const toLocalDate = (year: number, month: number, day: number) => new Date(year, month - 1, day, 12);

/** Format a local Gregorian calendar date for Persian presentation; digits stay ASCII. */
export const formatJalaliDate = (date: Date, format: string) => {
    const { jy, jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const pad = (value: number) => String(value).padStart(2, '0');
    const values: Record<string, string> = {
        YYYY: String(jy),
        YY: pad(jy % 100),
        MMMM: PERSIAN_MONTH_NAMES[jm - 1],
        MMM: PERSIAN_MONTH_NAMES[jm - 1],
        MM: pad(jm),
        M: String(jm),
        Do: String(jd),
        DD: pad(jd),
        D: String(jd),
    };

    return format.replace(/\[[^\]]*\]|Do|YYYY|MMMM|MMM|YY|MM|DD|M|D/g, (token) => {
        if (token.startsWith('[')) return token.slice(1, -1);
        return values[token] ?? token;
    });
};

/** Parse Persian calendar input at a text field boundary into a Gregorian Date. */
export const parseJalaliDateInput = (value: string, format: string): Date | null => {
    const normalized = digitsFaToEn(digitsArToFa(value.trim()));
    const tokens: string[] = [];
    const pattern = format.replace(/YYYY|YY|MM|M|DD|D|./g, (token) => {
        if (!['YYYY', 'YY', 'MM', 'M', 'DD', 'D'].includes(token)) {
            return token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        tokens.push(token);
        return token === 'YYYY' ? '(\\d{4})' : token === 'YY' ? '(\\d{2})' : '(\\d{1,2})';
    });
    const match = new RegExp(`^${pattern}$`).exec(normalized);
    if (!match) return null;

    const fields: Record<string, number> = {};
    tokens.forEach((token, index) => { fields[token[0]] = Number(match[index + 1]); });
    let year = fields.Y;
    if (format.includes('YY') && !format.includes('YYYY')) year += year < 50 ? 1400 : 1300;
    const month = fields.M;
    const day = fields.D;
    if (!isValidJalaaliDate(year, month, day)) return null;

    const gregorian = toGregorian(year, month, day);
    return toLocalDate(gregorian.gy, gregorian.gm, gregorian.gd);
};

/** Return the Gregorian dates that bound a Jalaali month, preserving local date fields. */
export const getJalaliMonthRange = (date: Date, monthOffset = 0) => {
    const { jy, jm } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const monthIndex = jy * 12 + jm - 1 + monthOffset;
    const year = Math.floor(monthIndex / 12);
    const month = monthIndex - year * 12 + 1;
    const lastDay = jalaaliMonthLength(year, month);
    const first = toGregorian(year, month, 1);
    const last = toGregorian(year, month, lastDay);
    if (!isValidJalaaliDate(year, month, lastDay)) {
        throw new RangeError('Date is outside the supported Jalaali calendar range');
    }
    return {
        from: toLocalDate(first.gy, first.gm, first.gd),
        to: toLocalDate(last.gy, last.gm, last.gd),
    };
};

/** Build a Saturday-first calendar grid while retaining Gregorian Date values for selection. */
export const getJalaliMonthGrid = (date: Date, fixedWeeks = false) => {
    const { jy, jm } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const monthLength = jalaaliMonthLength(jy, jm);
    const firstGregorian = toGregorian(jy, jm, 1);
    const firstDate = toLocalDate(firstGregorian.gy, firstGregorian.gm, firstGregorian.gd);
    const leadingDays = (firstDate.getDay() + 1) % 7;
    const weekCount = fixedWeeks ? 6 : Math.ceil((leadingDays + monthLength) / 7);
    const gridStart = new Date(firstDate);
    gridStart.setDate(firstDate.getDate() - leadingDays);

    return {
        year: jy,
        month: jm,
        monthName: PERSIAN_MONTH_NAMES[jm - 1],
        days: Array.from({ length: weekCount * 7 }, (_, index) => {
            const dayDate = new Date(gridStart);
            dayDate.setDate(gridStart.getDate() + index);
            const jalali = toJalaali(dayDate.getFullYear(), dayDate.getMonth() + 1, dayDate.getDate());
            return {
                date: dayDate,
                day: jalali.jd,
                inCurrentMonth: jalali.jy === jy && jalali.jm === jm,
            };
        }),
    };
};

/** Return the Saturday-Friday boundaries of the containing Jalaali week. */
export const getJalaliWeekRange = (date: Date) => {
    const { jy, jm, jd } = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const { saturday, friday } = jalaaliWeek(jy, jm, jd);
    const start = toGregorian(saturday.jy, saturday.jm, saturday.jd);
    const end = toGregorian(friday.jy, friday.jm, friday.jd);
    return {
        from: toLocalDate(start.gy, start.gm, start.gd),
        to: toLocalDate(end.gy, end.gm, end.gd),
    };
};
