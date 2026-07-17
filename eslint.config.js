import xo from 'xo';

const config = xo.xoToEslintConfig([
	{space: false, prettier: 'compat'},
	{
		rules: {
			'@stylistic/indent': 'off',
			'@stylistic/indent-binary-ops': 'off',
		},
	},
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
