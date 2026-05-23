import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import swc from '@swc/core';
import type {CoverageReportOptions, V8CoverageEntry} from 'monocart-coverage-reports';

const baseDir = import.meta.dirname;

const onEntry = async (entry: V8CoverageEntry) => {
	const filePath = fileURLToPath(entry.url);
	if (!filePath.endsWith('.ts')) {
		return;
	}

	const originalSource = await fs.readFile(filePath, 'utf8');

	const {code, map} = await swc.transform(originalSource, {
		// Some options cannot be specified in .swcrc
		filename: filePath,
		sourceMaps: true,
		isModule: true,

		// All options below can be configured via .swcrc
		jsc: {
			parser: {
				syntax: 'typescript',
			},
			transform: {},
		},
	});
	entry.source = code;
	if (map) {
		entry.sourceMap = JSON.parse(map) as unknown;
	}

	entry.fake = false;
};

const filter = {
	'**/node_modules/**': false,
	'**/*.test.*': false,
	'**/test/**': false,
	'**': true,
};

const config = {
	sourceMap: true,
	logging: 'info',
	name: 'Unit Coverage Report',
	outputDir: path.join(import.meta.dirname, '.moon/cache/coverage/packages', path.basename(process.cwd())),

	filter,
	baseDir,

	reports: [
		'raw',
	],

	onEntry,

	all: {
		dir: ['./src'],

		transformer: onEntry,
	},
} satisfies CoverageReportOptions;

export default config;
