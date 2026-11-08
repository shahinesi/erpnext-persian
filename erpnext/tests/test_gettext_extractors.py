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
