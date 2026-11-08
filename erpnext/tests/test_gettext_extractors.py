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
