import ts from 'typescript';
import z from 'zod';
import {
	createAuxiliaryTypeStore, zodToTs, printNode,
} from 'zod-to-ts';
import {assertAtLeastOne} from '../lib/utils.ts';
import {requestValidators} from './request-validators.ts';
import {responseValidators} from './response-validators.ts';

const auxiliaryTypeStore = createAuxiliaryTypeStore();

const qrcRequestDiscriminatedUnion = z.discriminatedUnion(
	'method',
	assertAtLeastOne(Object.entries(requestValidators)
		.map(([key, value]) => z.object({
			jsonrpc: z.literal('2.0'),
			method: z.literal(key),
			params: value,
		}))),
);

const qrcRequestAlias = ts.factory.createTypeAliasDeclaration(
	[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
	'QRCRequest',
	undefined,
	zodToTs(qrcRequestDiscriminatedUnion, {auxiliaryTypeStore}).node,
);

const responseResultElements: ts.PropertySignature[] = [];

for (const [key, validator] of Object.entries(responseValidators)) {
	const {node} = zodToTs(validator, {auxiliaryTypeStore});
	responseResultElements.push(ts.factory.createPropertySignature(
		undefined,
		ts.factory.createStringLiteral(key, true),
		undefined,
		node,
	));
}

const responseResultMap = ts.factory.createTypeAliasDeclaration(
	[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
	'QrcResultMap',
	undefined,
	ts.factory.createTypeLiteralNode(responseResultElements),
);

console.log(`${printNode(qrcRequestAlias)}

${printNode(responseResultMap)}

export type QrcMethod = QRCRequest['method'];
export type QrcParams = QRCRequest['params'];
export type InferQrcRequest<M extends QrcMethod> = Extract<QRCRequest, { method: M }>;
export type InferQrcParams<M extends QrcMethod> = InferQrcRequest<M>['params'];
export type QrcRequestMap = {[M in QrcMethod]: InferQrcRequest<M>};
export type QrcParamMap = {[M in QrcMethod]: InferQrcParams<M>};
`);
