import unittest
from unittest.mock import Mock, patch

from documentation import check_pull_request


class DocumentationCheckTests(unittest.TestCase):
	@patch("documentation.requests.get")
	def test_fork_pull_request_uses_current_repository_and_requires_docs_link(self, get):
		response = Mock(ok=True)
		response.json.return_value = {
			"title": "feat: translate ERPNext sales and finance UI",
			"head": {"sha": "abc123"},
			"body": "Documentation: https://docs.frappe.io/erpnext/sales-order",
		}
		get.return_value = response

		self.assertEqual(check_pull_request("7", "shahinesi/erpnext-persian"), (0, "Documentation Link Found. You're Awesome! 🎉"))
		get.assert_called_once_with("https://api.github.com/repos/shahinesi/erpnext-persian/pulls/7")

		response.json.return_value["body"] = "No documentation reference"
		self.assertEqual(check_pull_request("7", "shahinesi/erpnext-persian"), (1, "Documentation Link Not Found! ⚠️"))

	@patch("documentation.requests.get")
	def test_invalid_repository_context_fails_closed(self, get):
		self.assertEqual(check_pull_request("7", "https://example.com"), (1, "Invalid repository context! ⚠️"))
		get.assert_not_called()


if __name__ == "__main__":
	unittest.main()
