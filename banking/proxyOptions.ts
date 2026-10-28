import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const commonSiteConfigUrl = new URL('../../../sites/common_site_config.json', import.meta.url);
const commonSiteConfig = existsSync(fileURLToPath(commonSiteConfigUrl))
	? JSON.parse(readFileSync(commonSiteConfigUrl, 'utf8')) as { webserver_port?: string | number }
	: {};
const webserver_port = commonSiteConfig.webserver_port || process.env.FRAPPE_WEB_SERVER_PORT || 8000;

export default {
	'^/(app|api|assets|files|private)': {
		target: `http://127.0.0.1:${webserver_port}`,
		ws: true,
		router: function (req) {
			const site_name = req.headers?.host?.split(':')[0];
			return `http://${site_name ?? 'localhost'}:${webserver_port}`;
		}
	}
};
