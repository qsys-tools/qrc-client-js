import ts, {type PropertySignature, type TypeAliasDeclaration} from 'typescript';
import {
	createAuxiliaryTypeStore, createTypeAlias, zodToTs, printNode,
} from 'zod-to-ts';
import {requestValidators} from './request-validators.ts';

const auxiliaryTypeStore = createAuxiliaryTypeStore();

const typeAliases: TypeAliasDeclaration[] = [];
const requestParameterMapElements: PropertySignature[] = [];

for (const [key, validator] of Object.entries(requestValidators)) {
	const {node} = zodToTs(validator, {auxiliaryTypeStore});
	const name = key.replace('.', '_') + 'Params';
	const alias = createTypeAlias(node, name);
	typeAliases.push(alias);

	requestParameterMapElements.push(ts.factory.createPropertySignature(
		undefined,
		ts.factory.createStringLiteral(key, true),
		undefined,
		ts.factory.createTypeReferenceNode(name),
	));
}

const requestParameterMap = ts.factory.createTypeAliasDeclaration(
	[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
	'requestParameterMap',
	undefined,
	ts.factory.createTypeLiteralNode(requestParameterMapElements),
);

const file = ts.factory.createSourceFile(
	[...typeAliases, requestParameterMap],
	ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
	ts.NodeFlags.None,
);

console.log(printNode(file));
