import fs from 'node:fs';
import path from 'node:path';
import {CoverageReport, type CoverageReportOptions} from 'monocart-coverage-reports';

const rootDir = path.join(import.meta.dirname, '../../../');
const coverageDir = path.join(rootDir, './.moon/cache/coverage/packages');
const inputDir = fs.readdirSync(coverageDir).map(dir => path.join(coverageDir, dir, 'raw'));

const coverageOptions = {
	name: 'Merged Coverage',
	logging: 'info',
	sourceMap: true,
	inputDir,

	outputDir: path.join(rootDir, 'coverage'),

	reports: [
		['v8'],
		['v8-json'],
		['console-summary'],
		['markdown-summary'],
		['markdown-details'],
		['lcovonly'],
	],

} satisfies CoverageReportOptions;
await new CoverageReport(coverageOptions).generate();
