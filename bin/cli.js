#!/usr/bin/env node

/**
 * nodeEmail-cleaner CLI
 * Clean Mailchimp HTML email exports.
 *
 * Usage:
 *   node bin/cli.js input.html -o output.html [-v] [--width 660]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, basename, extname } from 'node:path';
import { Command } from 'commander';
import { clean } from '../src/index.js';

const program = new Command();

program
  .name('nodeEmail-cleaner')
  .description('Clean Mailchimp HTML email exports — remove editor bloat, purge CSS, simplify tables')
  .version('1.0.0')
  .argument('<input>', 'Input HTML file')
  .option('-o, --output <file>', 'Output file (default: <input>-clean.html)')
  .option('-w, --width <px>', 'Max width for MSO wrappers', parseInt, 660)
  .option('--no-mso-wrappers', 'Do not add MSO conditional wrappers')
  .option('--no-preheader-fix', 'Do not modify the preheader')
  .option('--no-css-clean', 'Do not purge unused CSS')
  .option('-v, --verbose', 'Show stats (lines, size, transforms)')
  .action(async (input, opts) => {
    try {
      const inputPath = resolve(input);
      const html = await readFile(inputPath, 'utf-8');

      const originalLines = html.split('\n').length;
      const originalSize = Buffer.byteLength(html, 'utf-8');

      const result = await clean(html, {
        width: opts.width,
        msoWrappers: opts.msoWrappers,
        preheaderFix: opts.preheaderFix,
        cssClean: opts.cssClean,
      });

      // Determine output path
      let outputPath;
      if (opts.output) {
        outputPath = resolve(opts.output);
      } else {
        const ext = extname(inputPath);
        const base = basename(inputPath, ext);
        outputPath = resolve(inputPath, '..', `${base}-clean${ext}`);
      }

      await writeFile(outputPath, result.html, 'utf-8');

      const cleanedLines = result.html.split('\n').length;
      const cleanedSize = Buffer.byteLength(result.html, 'utf-8');

      console.log(`Done! ${outputPath}`);

      if (opts.verbose) {
        console.log('');
        console.log('--- Stats ---');
        console.log(`  Lines:  ${originalLines} -> ${cleanedLines} (${Math.round((1 - cleanedLines / originalLines) * 100)}% reduction)`);
        console.log(`  Size:   ${formatSize(originalSize)} -> ${formatSize(cleanedSize)} (${Math.round((1 - cleanedSize / originalSize) * 100)}% reduction)`);
        console.log('');
        console.log('  Transforms:');
        for (const stat of result.stats) {
          const details = Object.entries(stat)
            .filter(([k]) => k !== 'name')
            .map(([k, v]) => `${k}=${v}`)
            .join(', ');
          console.log(`    - ${stat.name}: ${details}`);
        }
      }
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
  });

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

program.parse();
