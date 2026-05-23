import xo from 'xo';
import pkg from './package.json' with {type: 'json'};

const config = xo.xoToEslintConfig([
	{space: false, prettier: 'compat'},
	{
		rules: {
			'@stylistic/indent': 'off',
			'@stylistic/indent-binary-ops': 'off',
		},
	},
	...pkg.xo,
]);

for (const cf of config) {
	if (cf.rules) {
		for (const ruleName in cf.rules) {
			if (cf.rules[ruleName] === undefined) {
				delete cf.rules[ruleName];
			}
		}
	}
}

export default config;
