import frappe

from erpnext import encode_company_abbr, require_permission, require_user_permission
from erpnext.tests.permission_test_utils import (
	MISSING_NAME,
	as_user,
	assert_refused,
	assert_refused_for_names,
	make_fenced_user,
	malformed_names,
)
from erpnext.tests.utils import ERPNextTestSuite

TEST_USER = "test_init_stock_user@example.com"


def require_warehouse_permission(name):
	require_permission("Warehouse", name)


def require_warehouse_user_permission(name):
	require_user_permission("Warehouse", name)


def name_kwargs(name):
	return {"name": name}


class TestInit(ERPNextTestSuite):
	def test_encode_company_abbr(self):
		abbr = "NFECT"

		names = [
			"Warehouse Name",
			"ERPNext Foundation India",
			f"Gold - Member - {abbr}",
			f" - {abbr}",
			"ERPNext - Foundation - India",
			f"ERPNext Foundation India - {abbr}",
			f"No-Space-{abbr}",
			"- Warehouse",
		]

		expected_names = [
			f"Warehouse Name - {abbr}",
			f"ERPNext Foundation India - {abbr}",
			f"Gold - Member - {abbr}",
			f" - {abbr}",
			f"ERPNext - Foundation - India - {abbr}",
			f"ERPNext Foundation India - {abbr}",
			f"No-Space-{abbr} - {abbr}",
			f"- Warehouse - {abbr}",
		]

		for i in range(len(names)):
			enc_name = encode_company_abbr(names[i], abbr=abbr)
			self.assertTrue(
				enc_name == expected_names[i],
				f"{enc_name} is not same as {expected_names[i]}",
			)

	def test_translation_files(self):
		from frappe.tests.test_translate import verify_translation_files

		verify_translation_files("erpnext")

	def test_persian_financial_catalog_messages(self):
		from frappe.gettext.translate import get_catalog

		catalog = get_catalog("erpnext", "fa")
		expected = {
			"Accounts Setup": "راه‌اندازی حسابداری",
			"Annual Sales": "فروش سالانه",
			"AP Summary": "خلاصه حساب‌های پرداختنی",
			"AR Summary": "خلاصه حساب‌های دریافتنی",
			"Budget Variance": "انحراف بودجه",
			"Consolidated Report": "گزارش تلفیقی",
			"Customer Ledger": "دفتر حساب مشتریان",
			"First Delivery Date": "تاریخ اولین تحویل",
			"Get Delivery Schedule": "ایجاد برنامه تحویل",
			"Total Advance Received: {0}": "مجموع پیش‌پرداخت دریافت‌شده: {0}",
			"Outgoing Bills (Sales Invoice)": "صورتحساب‌های فروش",
			"Payable Amount": "مبلغ پرداختنی",
			"Payment methods refreshed. Please review before proceeding.": "روش‌های پرداخت به‌روزرسانی شدند. لطفاً پیش از ادامه آن‌ها را بررسی کنید.",
			"Proforma": "پیش‌فاکتور",
			"Proforma Invoices": "پیش‌فاکتورها",
			"Select Items up to Delivery Date": "انتخاب کالاها تا تاریخ تحویل",
			"Settled with Credit Note": "تسویه‌شده با یادداشت بستانکار",
			"Supplier Ledger": "دفتر حساب تأمین‌کنندگان",
			"Shipping Contact": "مخاطب ارسال",
			"Shipping Contact Email": "ایمیل مخاطب ارسال",
			"Shipping Contact Mobile No": "شماره همراه مخاطب ارسال",
			"Shipping Contact Person": "شخص مخاطب ارسال",
			"Tax Template": "الگوی مالیاتی",
			"Totals (Company Currency)": "مجموع (ارز شرکت)",
			"Grand Total (Transaction Currency)": "جمع کل (ارز تراکنش)",
			"Grand Total must match sum of Payment References": "جمع کل باید با مجموع ارجاع‌های پرداخت برابر باشد",
		}
		for source, translation in expected.items():
			with self.subTest(source=source):
				self.assertEqual(catalog[source].string, translation)

	def test_persian_proforma_print_messages(self):
		from frappe.gettext.translate import get_catalog

		catalog = get_catalog("erpnext", "fa")
		expected = {
			"Emailed To": "ایمیل‌شده به",
			"Hide Item Quantity in Print": "پنهان‌کردن مقدار کالا در چاپ",
			"Hide the item quantity and rate on the printed proforma.": "مقدار و نرخ کالا را در پیش‌فاکتور چاپی پنهان می‌کند.",
			"No proforma invoices yet.": "هنوز پیش‌فاکتوری وجود ندارد.",
			"Proforma PDF": "فایل PDF پیش‌فاکتور",
			"Create Proforma Invoice": "ایجاد پیش‌فاکتور",
			"Creating Proforma Invoice...": "در حال ایجاد پیش‌فاکتور...",
			"New Proforma Invoice": "پیش‌فاکتور جدید",
			"Proforma Invoice {0} created": "پیش‌فاکتور {0} ایجاد شد",
			"Proforma No": "شماره پیش‌فاکتور",
			"View PDF": "مشاهده PDF",
		}
		for source, translation in expected.items():
			with self.subTest(source=source):
				self.assertEqual(catalog[source].string, translation)

	def test_persian_proforma_settings_validation_message(self):
		from frappe.gettext.translate import get_catalog

		catalog = get_catalog("erpnext", "fa")
		self.assertEqual(
			catalog["Proforma Invoice is not enabled in Selling Settings."].string,
			"پیش‌فاکتور در تنظیمات فروش فعال نیست.",
		)

	def test_persian_quotation_revision_validation_message(self):
		from frappe.gettext.translate import get_catalog

		catalog = get_catalog("erpnext", "fa")
		self.assertEqual(
			catalog["A revision must have the same company as Quotation {0}."].string,
			"شرکت نسخه بازنگری‌شده باید با شرکت پیش‌فاکتور {0} یکسان باشد.",
		)

	def test_persian_sales_form_field_translations(self):
		from frappe.gettext.translate import get_catalog

		catalog = get_catalog("erpnext", "fa")
		forms = {
			"Sales Order": {
				"module": "Selling",
				"fields": {
					"customer": "مشتری",
					"order_type": "نوع سفارش",
					"delivery_date": "تاریخ تحویل",
					"grand_total": "جمع کل",
				},
			},
			"Sales Invoice": {
				"module": "Accounts",
				"fields": {
					"customer": "مشتری",
					"posting_date": "تاریخ ارسال",
					"due_date": "سررسید پرداخت",
					"outstanding_amount": "مبلغ معوقه",
					"debit_to": "بدهی به",
					"grand_total": "جمع کل",
				},
			},
		}

		for doctype, expectation in forms.items():
			meta = frappe.get_meta(doctype)
			with self.subTest(doctype=doctype):
				self.assertEqual(meta.module, expectation["module"])

			for fieldname, translation in expectation["fields"].items():
				with self.subTest(doctype=doctype, fieldname=fieldname):
					field = meta.get_field(fieldname)
					self.assertIsNotNone(field, f"{doctype}.{fieldname} is missing")
					self.assertEqual(catalog[field.label].string, translation)

	def test_persian_percent_catalog_messages_are_format_safe(self):
		from frappe.gettext.translate import get_catalog

		catalog = get_catalog("erpnext", "fa")
		expected = {
			"% of materials billed against this Sales Order": "٪ از مواد در برابر این سفارش فروش صورتحساب شدند",
			"% of materials delivered against this Pick List": "٪ مواد تحویل‌شده بر اساس این لیست انتخاب",
			"% of materials delivered against this Sales Order": "٪ از مواد در برابر این سفارش فروش تحویل شدند",
			"Progress % for a task cannot be more than 100.": "٪ پیشرفت برای یک کار نمی‌تواند بیشتر از ۱۰۰ باشد.",
			"{0}% of total invoice value will be given as discount.": "{0}٪ از ارزش کل فاکتور به عنوان تخفیف داده می‌شود.",
		}

		for source, translation in expected.items():
			with self.subTest(source=source):
				self.assertEqual(catalog[source].string, translation)

	def test_persian_financial_report_template_account_tree_titles(self):
		from frappe.gettext.translate import get_catalog

		catalog = get_catalog("erpnext", "fa")
		expected = {
			"Accounts Missing from Report": "حساب‌های جاافتاده از گزارش",
			"Accounts Included in Report": "حساب‌های موجود در گزارش",
		}

		for source, translation in expected.items():
			with self.subTest(source=source):
				self.assertEqual(catalog[source].string, translation)

	def test_persian_sales_workflow_and_report_messages(self):
		from frappe.gettext.translate import get_catalog

		catalog = get_catalog("erpnext", "fa")
		expected = {
			"Discount (%) on Price List Rate with Margin": "درصد تخفیف بر نرخ فهرست قیمت به‌همراه حاشیه سود",
			"Please enter a valid number of deliveries": "لطفاً تعداد معتبری برای تحویل‌ها وارد کنید.",
			"Please enter a valid quantity": "لطفاً مقدار معتبری وارد کنید.",
			"Please enter at least one delivery date and quantity": "لطفاً دست‌کم یک تاریخ و مقدار تحویل وارد کنید.",
			"Please enter the first delivery date": "لطفاً تاریخ نخستین تحویل را وارد کنید.",
			"Please select Items from the Table": "لطفاً کالاها را از جدول انتخاب کنید.",
			"Please select a frequency for delivery schedule": "لطفاً بازه تکرار برنامه تحویل را انتخاب کنید.",
			"Please select at least one item to continue": "برای ادامه، دست‌کم یک کالا را انتخاب کنید.",
			"Please select items to reserve.": "لطفاً کالاهایی را که باید رزرو شوند انتخاب کنید.",
			"If checked, updates inventory; stock and accounting entries are created together. Leave unchecked if a Delivery Note is created separately.": (
				"اگر انتخاب شود، موجودی را به‌روزرسانی می‌کند و ثبت‌های انبار و حسابداری هم‌زمان ایجاد می‌شوند. "
				"اگر یادداشت تحویل جداگانه ایجاد می‌کنید، این گزینه را انتخاب نکنید."
			),
			"Is Packed Item": "کالای بسته‌بندی‌شده است",
			"Issue a debit note against an existing Sales Invoice to adjust the rate. The quantity will be retained from the original invoice.": (
				"برای اصلاح نرخ، یادداشت بدهکار در برابر فاکتور فروش موجود صادر کنید. "
				"مقدار از فاکتور اصلی حفظ می‌شود."
			),
			"Item Wise Tax Details": "جزئیات مالیات به تفکیک کالا",
			"Amount to Bill": "مبلغ قابل صورتحساب",
			"Age as on": "قدمت تا تاریخ",
			"Statement Period": "دوره صورت‌حساب",
		}

		for source, translation in expected.items():
			with self.subTest(source=source):
				self.assertEqual(catalog[source].string, translation)

	def test_persian_sales_invoice_subcontracting_validation_messages(self):
		from frappe.gettext.translate import get_catalog

		catalog = get_catalog("erpnext", "fa")
		expected = {
			"All items must be linked to a Sales Order or Subcontracting Inward Order for this Sales Invoice.": (
				"همه اقلام باید برای این فاکتور فروش به یک سفارش فروش یا سفارش ورودی پیمانکاری فرعی پیوند داده شوند."
			),
			"All linked Sales Orders must be subcontracted.": "همه سفارش‌های فروش پیوندخورده باید از نوع پیمانکاری فرعی باشند.",
			"Subcontracting Inward Order": "سفارش ورودی پیمانکاری فرعی",
		}
		for source, translation in expected.items():
			with self.subTest(source=source):
				self.assertEqual(catalog[source].string, translation)

	def test_patches(self):
		from frappe.tests.test_patches import check_patch_files

		check_patch_files("erpnext")

	def test_no_unrendered_title_templates(self):
		import frappe

		modules = frappe.get_all("Module Def", filters={"app_name": "erpnext"}, pluck="name")
		for doctype in frappe.get_all("DocType", filters={"module": ("in", modules)}, pluck="name"):
			meta = frappe.get_meta(doctype)
			field = meta.get_field("title")
			if not field or not field.default or "{" not in field.default:
				continue

			self.assertEqual(
				meta.title_field,
				"title",
				f"{doctype}: title default {field.default!r} is stored verbatim because "
				"Document.set_title_field() only renders it when title_field is 'title'",
			)

	def test_require_permission_refuses_missing_and_malformed_names(self):
		with as_user(make_fenced_user(TEST_USER, ["Stock User"])):
			require_warehouse_permission("Stores - _TC")
			assert_refused_for_names(
				self,
				require_warehouse_permission,
				name_kwargs,
				["", 0, None, ["Stores - _TC"], True],
			)

	def test_require_user_permission_follows_the_fence(self):
		with as_user(make_fenced_user(TEST_USER, ["Stock User"], [("Warehouse", "Stores - _TC")])):
			require_warehouse_user_permission("Stores - _TC")
			assert_refused_for_names(
				self,
				require_warehouse_user_permission,
				name_kwargs,
				["Finished Goods - _TC", ["Stores - _TC"]],
			)

	def test_make_fenced_user_sets_exactly_the_given_roles_and_user_permissions(self):
		make_fenced_user(TEST_USER, ["Stock User", "Projects User"], [("Warehouse", "Stores - _TC")])
		user = make_fenced_user(
			TEST_USER,
			["Stock User"],
			[("Company", "_Test Company"), ("Warehouse", "_Test Warehouse Group - _TC", 1)],
		)

		self.assertEqual(user, TEST_USER)
		self.assertEqual(
			frappe.get_all("Has Role", filters={"parent": TEST_USER, "parenttype": "User"}, pluck="role"),
			["Stock User"],
		)
		user_permissions = []
		for row in frappe.get_all(
			"User Permission",
			filters={"user": TEST_USER},
			fields=["allow", "for_value", "hide_descendants", "apply_to_all_doctypes"],
			order_by="allow asc",
		):
			user_permissions.append(
				(row.allow, row.for_value, row.hide_descendants, row.apply_to_all_doctypes)
			)
		self.assertEqual(
			user_permissions,
			[("Company", "_Test Company", 0, 1), ("Warehouse", "_Test Warehouse Group - _TC", 1, 1)],
		)
		with as_user(user):
			self.assertIn("Stock User", frappe.get_roles())
			self.assertNotIn("Projects User", frappe.get_roles())

	def test_as_user_restores_the_previous_user(self):
		user = make_fenced_user(TEST_USER, ["Stock User"])
		previous = frappe.session.user

		with as_user(user) as current:
			self.assertEqual(current, user)
			self.assertEqual(frappe.session.user, user)
		self.assertEqual(frappe.session.user, previous)

		with self.assertRaises(frappe.ValidationError):
			with as_user(user):
				frappe.throw("_Test as_user failure")
		self.assertEqual(frappe.session.user, previous)

	def test_assert_refused_for_names_covers_the_malformed_names(self):
		seen = []

		def refuse(name):
			seen.append(name)
			frappe.throw_permission_error()

		assert_refused_for_names(self, refuse, name_kwargs, ["_Test Forbidden"])

		expected = ["_Test Forbidden"]
		for name in malformed_names():
			expected.append(name)
		self.assertEqual(seen, expected)
		self.assertIn(MISSING_NAME, seen)
		with self.assertRaises(AssertionError):
			assert_refused(self, frappe.throw, "_Test not a permission error", frappe.PermissionError)
