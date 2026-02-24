# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CLI tool and Node.js library that cleans Mailchimp HTML email exports. Removes editor artifacts, purges unused CSS, simplifies table nesting, and adds Outlook-compatible wrappers — reducing file size by ~60%.

Requires **Node.js 20+**. Uses **ES Modules** throughout.

## Commands

```bash
# Run tests (Node.js native test runner)
npm test

# Run CLI
node bin/cli.js input.html -o output.html

# CLI with verbose stats
node bin/cli.js input.html -o output.html -v

# Skip specific transforms
node bin/cli.js input.html --no-css-clean --no-mso-wrappers --no-preheader-fix -o output.html
```

## Architecture

**Transform pipeline:** `src/index.js` exposes a `clean(html, options)` function that loads HTML into cheerio, then runs a sequence of independent transforms in order:

1. `remove-data-attrs` — strips `data-*` attributes
2. `remove-empty-tags` — removes empty `<div>`, `<colgroup>`, `<col>`
3. `remove-google-fonts` — removes Google Fonts `<link>` tags
4. `clean-classes` — removes ~40 Mailchimp editor classes/IDs (preserves section classes, `.mceText`, `.mcnTextContent`)
5. `clean-css` — purges CSS rules that only target editor selectors
6. `simplify-tables` — unwraps unnecessary nested `<table>` layers when outer table adds no visual styling
7. `add-mso-wrappers` — adds `<!--[if (gte mso 9)|(IE)]>` table wrappers for Outlook
8. `fix-preheader` — appends anti-preview-text padding characters

Each transform signature: `($: CheerioAPI, options?) → { name: string, ...metrics }`. All transforms mutate the shared cheerio instance and return stats.

**CLI** (`bin/cli.js`) uses commander, reads/writes files, aggregates transform stats.

**Shared helpers** (`src/utils/html-helpers.js`): `removeAttr`, `removeElements`, `isEmptyElement`, `removeClasses`, `removeIdAttrs`.

## Conventions

- **ES Modules** (`import`/`export`) — no CommonJS
- **Filenames:** kebab-case; **variables/functions:** camelCase
- **Cheerio init options:** always `{ xml: false, decodeEntities: false }`
- Transforms must preserve: all images, links, template variables (`${...}`), VML/MSO markup, inline styles, and section classes
- Tests use Node.js native `node:test` and `node:assert` — no external test framework
