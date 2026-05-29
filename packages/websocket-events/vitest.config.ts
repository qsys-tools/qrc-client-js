import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		include: ['*.test.ts', 'test/**/*.test.ts', 'src/**/*.test.ts'],
		coverage: {
			reporter: ['raw', 'console-summary'],
			provider: 'custom',
			reportOnFailure: true,
			reportsDirectory: '../../.moon/cache/coverage/packages/websocket-events',
			customProviderModule: 'vitest-monocart-coverage',
		},
	},
});
