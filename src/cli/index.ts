#!/usr/bin/env node
import {
    generateServices,
    parseGenerateServicesArgs,
} from "./commands/generate-services";

function printUsage() {
    console.log(`Usage: ts-json-rpc <command> [options]

Commands:
  generate-services    Generate service definition files (def.ts) from methods.ts files
  help                 Print this usage message

Options for generate-services:
  --base-directory <dir>    Base directory to scan for methods.ts files (default: src)
  --zod-import <spec>       Module specifier to import zod from (default: zod/v4)
  --watch                   Re-run generation when methods.ts files change
`);
}

async function main() {
    const [command, ...rest] = process.argv.slice(2);

    switch (command) {
        case "generate-services":
            await generateServices(parseGenerateServicesArgs(rest));
            return;
        case "help":
        case "--help":
        case "-h":
            printUsage();
            return;
        case undefined:
            printUsage();
            process.exit(1);
            return;
        default:
            console.error(`Unknown command: ${command}\n`);
            printUsage();
            process.exit(1);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
