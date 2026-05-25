import {defineConfig} from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		include: ['*.test.ts', 'test/**/*.test.ts', 'src/**/*.test.ts'],
		coverage: {
			reporter: ['raw'],
			include: ['src/**'],
			reportsDirectory: '../../.moon/cache/coverage/packages/json-rpc-channel',
			reportOnFailure: true,
			provider: 'custom',
			customProviderModule: 'vitest-monocart-coverage',
		},
	},
});
