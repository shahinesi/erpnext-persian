import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatJalaliDate, getJalaliMonthGrid, getJalaliMonthRange, JALALI_MONTH_NAMES, JALALI_WEEKDAY_NAMES } from "@/lib/jalaliDate"
import { isPersianLocale } from "@/lib/date"
import { toJalaali } from "jalaali-js"
import _ from "@/lib/translate"

function Calendar(props: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  if (isPersianLocale()) return <JalaliCalendar {...props} />
  return <GregorianCalendar {...props} />
}

function GregorianCalendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-surface-modal group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-outline-gray-1 border border-outline-gray-2 shadow-xs has-focus:ring-outline-gray-1/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute bg-surface-modal inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md ps-2 pe-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-ink-gray-5 [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-ink-gray-5 rounded-md flex-1 font-normal text-[0.8rem] select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn(
          "select-none w-(--cell-size)",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] select-none text-ink-gray-5",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-e-md group/day aspect-square select-none",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-s-md"
            : "[&:first-child[data-selected=true]_button]:rounded-s-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "rounded-s-md bg-surface-gray-1",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-e-md bg-surface-gray-1", defaultClassNames.range_end),
        today: cn(
          "bg-surface-gray-1 text-ink-gray-8 rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-ink-gray-5 aria-selected:text-ink-gray-5",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-ink-gray-5 opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function JalaliCalendar(props: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const options = props as any
  const selected = options.selected as Date | { from?: Date; to?: Date } | undefined
  const initial = options.defaultMonth ?? (selected instanceof Date ? selected : selected?.from) ?? new Date()
  const [monthAnchor, setMonthAnchor] = React.useState<Date>(initial)
  React.useEffect(() => setMonthAnchor(initial), [initial.getFullYear(), initial.getMonth()])

  const monthCount = Math.max(1, options.numberOfMonths ?? 1)
  const shown = Array.from({ length: monthCount }, (_, index) => ({
    offset: index,
    range: getJalaliMonthRange(monthAnchor, index),
    grid: getJalaliMonthGrid(getJalaliMonthRange(monthAnchor, index).from, options.fixedWeeks),
  }))
  const isDisabled = (date: Date): boolean => {
    const match = (matcher: unknown): boolean => {
      if (matcher instanceof Date) return sameDay(matcher, date)
      if (Array.isArray(matcher)) return matcher.some(match)
      if (typeof matcher === 'function') return Boolean((matcher as (d: Date) => boolean)(date))
      if (matcher && typeof matcher === 'object') {
        const rule = matcher as { before?: Date; after?: Date; dayOfWeek?: number[] }
        if (rule.before && date < startOfDay(rule.before)) return true
        if (rule.after && date > endOfDay(rule.after)) return true
        if (rule.dayOfWeek?.includes(date.getDay())) return true
      }
      return false
    }
    return match(options.disabled)
      || Boolean(options.startMonth && date < startOfMonth(options.startMonth))
      || Boolean(options.endMonth && date > endOfMonth(options.endMonth))
  }

  const pick = (date: Date) => {
    if (isDisabled(date)) return
    if (options.mode === 'range') {
      const range = selected && !(selected instanceof Date) ? selected : undefined
      let next: { from?: Date; to?: Date }
      if (!range?.from || range.to) next = { from: date, to: undefined }
      else next = date < range.from ? { from: date, to: range.from } : { from: range.from, to: date }
      options.onSelect?.(next, date, {}, {} as React.MouseEvent)
      return
    }
    options.onSelect?.(date, date, {}, {} as React.MouseEvent)
  }

  const move = (offset: number) => setMonthAnchor(getJalaliMonthRange(monthAnchor, offset).from)
  const previousRange = getJalaliMonthRange(monthAnchor, -1)
  const nextRange = getJalaliMonthRange(monthAnchor, monthCount)
  const previousDisabled = Boolean(options.startMonth && previousRange.from < startOfMonth(options.startMonth))
  const nextDisabled = Boolean(options.endMonth && nextRange.from > endOfMonth(options.endMonth))
  const currentGrid = shown[0].grid
  const firstYear = options.startMonth
    ? toJalaali(options.startMonth.getFullYear(), options.startMonth.getMonth() + 1, options.startMonth.getDate()).jy
    : currentGrid.year - 100
  const lastYear = options.endMonth
    ? toJalaali(options.endMonth.getFullYear(), options.endMonth.getMonth() + 1, options.endMonth.getDate()).jy
    : currentGrid.year + 100
  const years = Array.from({ length: Math.max(0, lastYear - firstYear + 1) }, (_, index) => firstYear + index)

  return (
    <div data-slot="calendar" dir="rtl" className={cn("bg-surface-modal group/calendar p-3 [--cell-size:--spacing(8)]", options.className)}>
      <div className="flex items-center justify-between mb-3">
        <Button type="button" variant={options.buttonVariant ?? 'ghost'} isIconButton disabled={previousDisabled} aria-label={_("Previous month")} onClick={() => move(-1)}>
          <ChevronRightIcon className="size-4" />
        </Button>
        <div className="flex gap-2 text-sm font-medium" aria-live="polite">
          <select
            aria-label={_("Month")}
            className="rounded-md border border-outline-gray-2 bg-surface-modal px-2 py-1"
            value={currentGrid.month}
            onChange={(event) => setMonthAnchor(getJalaliMonthRange(monthAnchor, Number(event.target.value) - currentGrid.month).from)}
          >
            {JALALI_MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
          </select>
          <select
            aria-label={_("Year")}
            className="rounded-md border border-outline-gray-2 bg-surface-modal px-2 py-1"
            value={currentGrid.year}
            onChange={(event) => setMonthAnchor(getJalaliMonthRange(monthAnchor, (Number(event.target.value) - currentGrid.year) * 12).from)}
          >
            {years.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <Button type="button" variant={options.buttonVariant ?? 'ghost'} isIconButton disabled={nextDisabled} aria-label={_("Next month")} onClick={() => move(1)}>
          <ChevronLeftIcon className="size-4" />
        </Button>
      </div>
      <div className="flex gap-4">
        {shown.map(({ grid, offset }) => (
          <div key={offset} className="w-64" role="group" aria-label={`${grid.monthName} ${grid.year}`}>
            <div className="grid grid-cols-7 mb-2">
              {JALALI_WEEKDAY_NAMES.map((name) => <div key={name} className="text-center text-xs text-ink-gray-5 py-1" aria-label={name}>{name.slice(0, 1)}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {grid.days.map(({ date, day, inCurrentMonth }) => {
                const range = selected && !(selected instanceof Date) ? selected : undefined
                const isStart = Boolean(range?.from && sameDay(range.from, date))
                const isEnd = Boolean(range?.to && sameDay(range.to, date))
                const isMiddle = Boolean(range?.from && range?.to && date > startOfDay(range.from) && date < startOfDay(range.to))
                const isSelected = selected instanceof Date && sameDay(selected, date)
                const today = sameDay(new Date(), date)
                const outside = !inCurrentMonth
                return (
                  <div key={date.toISOString()} className={cn("aspect-square", (isStart || isEnd) && "bg-surface-gray-1")}>
                    {(!outside || options.showOutsideDays !== false) && <Button
                      type="button"
                      variant="ghost"
                      isIconButton
                      disabled={isDisabled(date) || (outside && options.showOutsideDays === false)}
                      aria-label={formatJalaliDate(date, 'D MMMM YYYY')}
                      aria-pressed={isSelected || isStart || isEnd}
                      data-day={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`}
                      className={cn(
                        "w-full h-full rounded-md font-normal",
                        outside && "text-ink-gray-5 opacity-60",
                        today && "outline outline-1 outline-outline-gray-2",
                        (isSelected || isStart || isEnd) && "bg-surface-gray-7 text-ink-white hover:bg-surface-gray-7 hover:text-ink-white",
                        isMiddle && "rounded-none bg-surface-gray-1 text-ink-gray-8",
                      )}
                      onClick={() => pick(date)}
                    >{day}</Button>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      isIconButton
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-surface-gray-7 data-[selected-single=true]:text-ink-white data-[range-middle=true]:bg-surface-gray-1 data-[range-middle=true]:text-ink-gray-8 data-[range-start=true]:bg-surface-gray-7 data-[range-start=true]:text-ink-white data-[range-end=true]:bg-surface-gray-7 data-[range-end=true]:text-ink-white group-data-[focused=true]/day:border-outline-gray-1 group-data-[focused=true]/day:ring-outline-gray-1/50 dark:hover:text-ink-gray-8 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-e-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-s-md [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
