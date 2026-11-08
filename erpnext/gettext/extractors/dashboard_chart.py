import json


def extract(fileobj, *args, **kwargs):
	"""Extract the translatable empty-state copy from Dashboard Chart JSON records."""
	chart = json.load(fileobj)
	if not isinstance(chart, dict):
		return

	message = chart.get("empty_state_message")
	if message:
		yield None, "_", message, ["Dashboard chart empty-state message"]
