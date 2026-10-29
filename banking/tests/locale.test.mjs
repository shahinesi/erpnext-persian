import assert from 'node:assert/strict'
import test from 'node:test'

const { isPersianLocaleCode } = await import('../src/lib/locale.ts')

test('recognizes Persian locale identifiers and preserves non-Persian calendars', () => {
  for (const locale of ['fa', 'fa-IR', 'fa_IR', 'FA-ir', 'FA_IR']) {
    assert.equal(isPersianLocaleCode(locale), true, locale)
  }

  for (const locale of ['', 'en', 'en-US', 'ar', 'ar_IR']) {
    assert.equal(isPersianLocaleCode(locale), false, locale)
  }
})
