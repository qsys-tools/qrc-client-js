/* eslint-disable @typescript-eslint/no-var-requires */
// Set up the environment for tests and development.
// TODO: This should be allowed in XO by default
require('any-observable/register/zen');

require('@babel/polyfill');

require('@babel/register')({
	extensions: ['.js', '.ts']
});
