import ts from 'typescript';
import type z from 'zod';
import {
	createAuxiliaryTypeStore, zodToTs, printNode,
} from 'zod-to-ts';
import {requestValidators} from './request-validators.ts';
import {responseValidators} from './response-validators.ts';

const auxiliaryTypeStore = createAuxiliaryTypeStore();

const makeTypeMap = (typeMapIdentifier: string, validators: Record<string, z.ZodType>) => {
	const propertySignatures: ts.PropertySignature[] = [];

	for (const [key, validator] of Object.entries(validators)) {
		const {node} = zodToTs(validator, {auxiliaryTypeStore});
		propertySignatures.push(ts.factory.createPropertySignature(
			undefined,
			ts.factory.createStringLiteral(key, true),
			undefined,
			node,
		));
	}

	return ts.factory.createTypeAliasDeclaration(
		[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
		typeMapIdentifier,
		undefined,
		ts.factory.createTypeLiteralNode(propertySignatures),
	);
};

console.log(`${printNode(makeTypeMap('QrcParamMap', requestValidators))}

${printNode(makeTypeMap('QrcResultMap', responseValidators))}

export type QrcMethod = QRCRequest['method'];
export type QrcParams = QRCRequest['params'];
export type InferQrcRequest<M extends QrcMethod> = Extract<QRCRequest, { method: M }>;
export type InferQrcParams<M extends QrcMethod> = InferQrcRequest<M>['params'];
export type QrcRequestMap = {[M in QrcMethod]: InferQrcRequest<M>};
export type QrcParamMap = {[M in QrcMethod]: InferQrcParams<M>};
export type InferResponseResult<M extends QrcMethod> = M extends keyof QrcResultMap ? QrcResultMap[M] : unknown;
`);
