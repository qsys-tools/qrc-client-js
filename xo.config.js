/** @type {import('xo').FlatXoConfig} */
const xoConfig = [
	{
		files: [
			'**',
		],
		rules: {
			'@typescript-eslint/naming-convention': 'off',
			'@stylistic/quote-props': [
				'error',
				'consistent-as-needed',
			],
		},
	},
	{
		ignores: [
			'**/src/validation/generated-types.ts',
		],
	},
];

export default xoConfig;
