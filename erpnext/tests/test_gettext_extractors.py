import csv
import json
import unittest
from io import BytesIO, StringIO
from pathlib import Path

from babel.messages.extract import extract_from_dir
from babel.messages.mofile import write_mo
from babel.messages.pofile import read_po

from erpnext.gettext.extractors.dashboard_chart import extract


class TestERPNextGettextExtractors(unittest.TestCase):
	def test_extracts_empty_state_message_from_real_chart(self):
		chart_path = (
			Path(__file__).parents[1]
			/ "accounts"
			/ "dashboard_chart"
			/ "profit_and_loss"
			/ "profit_and_loss.json"
		)
		with chart_path.open(encoding="utf-8") as chart_file:
			messages = list(extract(chart_file))

		self.assertEqual(len(messages), 1)
		self.assertEqual(messages[0][1], "_")
		self.assertEqual(
			messages[0][2], "Your income and expenses over the year, and what's left as profit."
		)

	def test_ignores_chart_without_empty_state_message(self):
		chart = StringIO(json.dumps({"chart_name": "No empty state"}))
		self.assertEqual(list(extract(chart)), [])

	def test_stock_and_form_metadata_have_persian_translations(self):
		catalog_path = Path(__file__).parents[1] / "locale" / "fa.po"
		with catalog_path.open("rb") as catalog_file:
			catalog = read_po(catalog_file)

		expected = {
			"(A) Balance Qty": "(A) مقدار موجودی",
			"(B) Expected Balance Qty": "(B) مقدار موجودی مورد انتظار",
			"(C) Change in Stock Value": "(C) تغییر ارزش موجودی",
			"(D) Expected Change in Stock Value": "(D) تغییر مورد انتظار در ارزش موجودی",
			"(E) Valuation Rate": "(E) نرخ ارزش‌گذاری",
			"(F) Expected Valuation Rate": "(F) نرخ ارزش‌گذاری مورد انتظار",
			"(G) Balance Stock Value": "(G) ارزش موجودی مانده",
			"(H) Expected Balance Stock Value": "(H) ارزش موجودی ماندهٔ مورد انتظار",
			'<h5 class="text-muted uppercase">Or</h5>': '<h5 class="text-muted uppercase">یا</h5>',
			"A customer's confirmed order.": "سفارش تأییدشدهٔ مشتری.",
			"Applies a tax template automatically when its conditions match.": "در صورت تطبیق شرایط، قالب مالیاتی را به‌طور خودکار اعمال می‌کند.",
			"Bring in a bank statement to match its lines against your books.": "صورت‌حساب بانکی را وارد کنید تا ردیف‌های آن با دفاتر حسابداری تطبیق داده شوند.",
			"Cancel Maintenance Visits {0} before cancelling this Maintenance Visit": "پیش از لغو این بازدید تعمیر و نگهداری، بازدیدهای مربوط به آن ({0}) را لغو کنید.",
			"Cannot add an open task under completed Parent Task {0}.": "نمی‌توان یک وظیفهٔ باز را زیر وظیفهٔ والد تکمیل‌شدهٔ {0} افزود.",
			"Column {0}": "ستون {0}",
			"Contact Details": "اطلاعات تماس",
			"Email users for progress updates": "ارسال ایمیل به کاربران برای دریافت گزارش پیشرفت",
			"Export Errored Rows": "برون‌بری ردیف‌های دارای خطا",
			"File '{0}' not found": "فایل «{0}» پیدا نشد.",
			"For Warehouse {0} must be a non-group warehouse under {1}.": "انبار {0} باید انباری غیرگروهی و زیرمجموعهٔ {1} باشد.",
			"from {0}": "از {0}",
			"How fast issues must be answered and resolved.": "مهلت پاسخ‌گویی و حل درخواست‌ها.",
			"Make {0}": "ایجاد {0}",
			"Matches payments to invoices in the background.": "پرداخت‌ها را در پس‌زمینه با صورتحساب‌ها تطبیق می‌دهد.",
			"Moves an asset to another location or person.": "دارایی را به مکان یا شخص دیگری منتقل می‌کند.",
			"No Tasks in this Project yet.": "هنوز هیچ وظیفه‌ای برای این پروژه ثبت نشده است.",
			"Opportunity From must be one of {0}": "مبدأ فرصت فروش باید یکی از گزینه‌های {0} باشد.",
			"Outgoing": "پرداختی",
			"Replace a BOM everywhere it is used, or update the cost of all BOMs.": "فهرست مواد (BOM) را در همهٔ جاهایی که استفاده شده جایگزین کنید یا هزینهٔ همهٔ فهرست‌ها را به‌روزرسانی کنید.",
			"Repost {0} is already pending.": "ثبت مجدد {0} از قبل در صف انتظار است.",
			"Row #{0}: Cannot return {1} of Batch {2}, only {3} was delivered and not returned yet.": "ردیف {0}: نمی‌توان {1} از بچ {2} را برگشت داد؛ فقط {3} تحویل شده و هنوز برگشت داده نشده است.",
			"Row {0}: Number of visits can not be more than the {1} days between Start and End Date": "ردیف {0}: تعداد بازدیدها نمی‌تواند از {1} روز فاصلهٔ بین تاریخ شروع و پایان بیشتر باشد.",
			"Row {0}: {1} {2} visits need an End Date of {3}. Change the End Date or the Number of Visits.": "ردیف {0}: برای {1} بازدید {2} باید تاریخ پایان {3} باشد. تاریخ پایان یا تعداد بازدیدها را تغییر دهید.",
			"Scheduler is inactive. Cannot import data.": "زمان‌بند غیرفعال است. امکان درون‌ریزی داده وجود ندارد.",
			"Sales without complexity, lock-in and per-user costs. Try it for free!": "فروش بدون پیچیدگی، وابستگی به فروشنده یا هزینهٔ هر کاربر. رایگان امتحان کنید!",
			"Successfully imported {0}": "{0} با موفقیت درون‌ریزی شد.",
			"Successfully updated {0}": "{0} با موفقیت به‌روزرسانی شد.",
			"Supplier Scorecard standing of {0}: {1}": "جایگاه کارنامهٔ تأمین‌کنندهٔ {0}: {1}",
			"The Condition '{0}' is invalid": "شرط «{0}» نامعتبر است.",
			"The criteria formula fails when every variable is {0}. Check its syntax and guard divisions by a variable, for example: {1}": "فرمول معیار وقتی همهٔ متغیرها {0} باشند خطا می‌دهد. نحو آن را بررسی کنید و تقسیم بر متغیر را کنترل کنید؛ برای نمونه: {1}",
			"This Month": "این ماه",
			"To Date": "تا تاریخ",
			"A separate set of books, for example to depreciate assets under another rule.": "مجموعه‌ای جداگانه از دفاتر حسابداری؛ برای نمونه، برای محاسبهٔ استهلاک دارایی‌ها بر پایهٔ قاعده‌ای دیگر.",
			"A set of discounts and free items, like buy two get one free.": "مجموعه‌ای از تخفیف‌ها و کالاهای رایگان، مانند «دو تا بخر، یکی رایگان بگیر».",
			"Additional Discount has been removed as Pricing Rule {0} is no longer applicable": "تخفیف اضافی حذف شد، زیرا قاعدهٔ قیمت‌گذاری {0} دیگر قابل اعمال نیست.",
			"After the adjustment, Item {0} in Warehouse {1} would hold a qty of {2} worth {3}, instead of {4} worth {5}.": "پس از اصلاح، موجودی کالای {0} در انبار {1} به مقدار {2} و ارزش {3} می‌رسد، درحالی‌که مقدار فعلی {4} و ارزش آن {5} است.",
			"Item {0} in Warehouse {1} was adjusted by {2} on {3}, so no stock transaction dated before it can be posted or cancelled. Post it on or after that date, or cancel the Adjustment Entry first.": "موجودی کالای {0} در انبار {1} در تاریخ {3} توسط {2} اصلاح شده است؛ بنابراین هیچ تراکنش موجودی با تاریخ پیش از آن قابل ثبت یا لغو نیست. تراکنش را در همان تاریخ یا پس از آن ثبت کنید، یا ابتدا سند اصلاح را لغو کنید.",
			"Customer {0} does not match the customer of Maintenance Schedule {1}": "مشتری {0} با مشتریِ برنامهٔ نگهداری و تعمیرات {1} مطابقت ندارد.",
			"Parent Task {0} is not in Project {1}. Pick a group task of the same project.": "وظیفهٔ والد {0} در پروژهٔ {1} نیست. یک وظیفهٔ گروهی از همان پروژه انتخاب کنید.",
		}
		for message, translation in expected.items():
			with self.subTest(message=message):
				self.assertEqual(catalog.get(message).string, translation)

	def test_babel_mapping_extracts_dashboard_chart_json(self):
		erpnext_root = Path(__file__).parents[1]
		repository_root = Path(__file__).parents[2]
		with (repository_root / "babel_extractors.csv").open(newline="", encoding="utf-8") as mapping_file:
			method_map = [
				(row[0], row[1])
				for row in csv.reader(mapping_file)
				if len(row) > 1 and row[1] == "erpnext.gettext.extractors.dashboard_chart.extract"
			]

		messages = {
			message
			for _, _, message, _, _ in extract_from_dir(str(erpnext_root), method_map)
			if message
		}
		self.assertIn(
			"Your income and expenses over the year, and what's left as profit.", messages
		)

	def test_all_dashboard_chart_empty_states_have_persian_translations(self):
		erpnext_root = Path(__file__).parents[1]
		catalog_path = erpnext_root / "locale" / "fa.po"
		with catalog_path.open("rb") as catalog_file:
			catalog = read_po(catalog_file)

		messages = set()
		for chart_path in erpnext_root.rglob("*.json"):
			if "dashboard_chart" not in chart_path.parts:
				continue
			with chart_path.open(encoding="utf-8") as chart_file:
				chart = json.load(chart_file)
			if isinstance(chart, dict) and chart.get("empty_state_message"):
				messages.add(chart["empty_state_message"])

		missing = sorted(message for message in messages if not catalog.get(message) or not catalog[message].string)
		self.assertEqual(missing, [])

		compiled_catalog = BytesIO()
		write_mo(compiled_catalog, catalog)
		self.assertGreater(len(compiled_catalog.getvalue()), 0)
