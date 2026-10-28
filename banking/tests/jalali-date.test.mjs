import assert from 'node:assert/strict'
import test from 'node:test'

process.env.TZ = 'Asia/Tehran'

const {
  formatJalaliDate,
  getJalaliMonthGrid,
  getJalaliMonthRange,
  getJalaliWeekRange,
  parseJalaliDateInput,
} = await import('../src/lib/jalaliDate.ts')

const dateFields = (date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()]
const isoDate = (date) => {
  const [year, month, day] = dateFields(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

test('formats Gregorian dates as Jalali with canonical ASCII digits around Tehran midnight', () => {
  const beforeMidnight = new Date(2025, 2, 20, 23, 59)
  const afterMidnight = new Date(2025, 2, 21, 0, 1)

  assert.equal(formatJalaliDate(beforeMidnight, 'YYYY/MM/DD'), '1403/12/30')
  assert.equal(formatJalaliDate(afterMidnight, 'YYYY/MM/DD'), '1404/01/01')
  assert.equal(formatJalaliDate(afterMidnight, 'Do MMMM YYYY'), '1 فروردین 1404')
  assert.match(formatJalaliDate(afterMidnight, 'YYYY/MM/DD'), /^[0-9/]+$/)
})

test('parses Persian and Arabic-Indic text input to Gregorian dates and rejects invalid days', () => {
  assert.deepEqual(dateFields(parseJalaliDateInput('۱۴۰۴/۰۱/۰۱', 'YYYY/MM/DD')), [2025, 3, 21])
  assert.deepEqual(dateFields(parseJalaliDateInput('١٤٠٤/٠١/٠١', 'YYYY/MM/DD')), [2025, 3, 21])
  assert.equal(parseJalaliDateInput('۱۴۰۳/۱۲/۳۰', 'YYYY/MM/DD') && isoDate(parseJalaliDateInput('۱۴۰۳/۱۲/۳۰', 'YYYY/MM/DD')), '2025-03-20')
  assert.equal(parseJalaliDateInput('۱۴۰۴/۱۲/۳۰', 'YYYY/MM/DD'), null)
})

test('uses Gregorian ISO boundaries for Jalaali months and Saturday-first weeks', () => {
  const farvardin = getJalaliMonthRange(new Date(2025, 2, 21, 23, 59))
  const leapEsfand = getJalaliMonthRange(new Date(2025, 2, 20, 23, 59))
  const week = getJalaliWeekRange(new Date(2025, 2, 21, 0, 1))
  const previousMonth = getJalaliMonthRange(new Date(2025, 2, 20), -1)

  assert.equal(isoDate(farvardin.from), '2025-03-21')
  assert.equal(isoDate(farvardin.to), '2025-04-20')
  assert.equal(isoDate(leapEsfand.from), '2025-02-19')
  assert.equal(isoDate(leapEsfand.to), '2025-03-20')
  assert.equal(isoDate(previousMonth.from), '2025-01-20')
  assert.equal(isoDate(previousMonth.to), '2025-02-18')
  assert.equal(isoDate(week.from), '2025-03-15')
  assert.equal(isoDate(week.to), '2025-03-21')
})

test('builds Saturday-first Jalali month grids with Gregorian selection dates', () => {
  const grid = getJalaliMonthGrid(new Date(2025, 2, 21), true)
  const currentMonthDays = grid.days.filter((entry) => entry.inCurrentMonth)
  const firstDay = currentMonthDays[0]
  const lastDay = currentMonthDays.at(-1)

  assert.equal(grid.monthName, 'فروردین')
  assert.equal(grid.year, 1404)
  assert.equal(grid.days.length, 42)
  assert.equal(firstDay.day, 1)
  assert.equal(firstDay.date.getDay(), 5, 'Farvardin 1, 1404 is a Friday in the current jalaali-js calendar')
  assert.equal(grid.days[0].date.getDay(), 6, 'calendar rows start on Saturday')
  assert.equal(lastDay.day, 31)
  assert.equal(isoDate(firstDay.date), '2025-03-21')
})
