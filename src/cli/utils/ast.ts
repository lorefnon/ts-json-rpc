import * as parser from "@babel/parser";
import type { Statement } from "@babel/types";

/**
 * Extracts all exported constant names from a TypeScript file
 * Returns a map of constant names to their properties (req/res flags)
 */
export function extractExportedConsts(
    code: string,
): Record<string, { req?: boolean; res?: boolean }> {
    const ast = parser.parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
    });

    const consts: Record<string, { req?: boolean; res?: boolean }> = {};

    ast.program.body.forEach(node => {
        if (node.type === "ExportNamedDeclaration") {
            const declaration = node.declaration;

            if (declaration && declaration.type === "VariableDeclaration") {
                declaration.declarations.forEach(varDeclarator => {
                    if (varDeclarator.id.type === "Identifier") {
                        consts[varDeclarator.id.name] = {};
                        if (varDeclarator.init?.type === "ObjectExpression") {
                            const props = varDeclarator.init.properties;
                            consts[varDeclarator.id.name].req = !!props.find(
                                _ =>
                                    _.type === "ObjectProperty" &&
                                    _.key.type === "Identifier" &&
                                    _.key.name === "req",
                            );
                            consts[varDeclarator.id.name].res = !!props.find(
                                _ =>
                                    _.type === "ObjectProperty" &&
                                    _.key.type === "Identifier" &&
                                    _.key.name === "res",
                            );
                        }
                    }
                });
            }

            if (node.specifiers) {
                node.specifiers.forEach(specifier => {
                    if (
                        specifier.type === "ExportSpecifier" &&
                        specifier.exported.type === "Identifier"
                    ) {
                        const exportName = specifier.exported.name;
                        consts[exportName] = {};
                    }
                });
            }
        }
    });

    return consts;
}

/**
 * Find a variable declaration by name in an AST node array
 */
export function findVariableDeclaration(
    nodes: Statement[],
    name: string,
    // biome-ignore lint/suspicious/noExplicitAny: AST node type varies
): any | null {
    for (const node of nodes) {
        if (
            node.type === "VariableDeclaration" &&
            node.declarations.some(
                // biome-ignore lint/suspicious/noExplicitAny: AST declaration type varies
                (decl: any) =>
                    decl.id.type === "Identifier" && decl.id.name === name,
            )
        ) {
            return node;
        }
    }
    return null;
}
