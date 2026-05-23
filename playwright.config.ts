import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {

	//@ts-ignore
	webServer: {
		command: 'npm run dev',
		port: 4000,
		reuseExistingServer: !process.env.CI,
	},
	timeout: 30000,
	// workers:1

};

export default config;
