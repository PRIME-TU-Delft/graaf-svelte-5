import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/lib/server/actions/tests/**/*.test.ts'],
		setupFiles: ['src/lib/server/actions/tests/helpers/setup.ts'],
		fileParallelism: false
	},
	resolve: {
		alias: {
			$lib: '/src/lib',
			'$env/dynamic/private': '/src/lib/server/actions/tests/helpers/env.ts'
		}
	}
});
