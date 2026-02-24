/**
 * Unit tests for nodeEmail-cleaner transforms.
 * Run with: node --test test/transforms.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

import removeDataAttrs from '../src/transforms/remove-data-attrs.js';
import removeEmptyTags from '../src/transforms/remove-empty-tags.js';
import removeGoogleFonts from '../src/transforms/remove-google-fonts.js';
import cleanClasses from '../src/transforms/clean-classes.js';
import simplifyTables from '../src/transforms/simplify-tables.js';
import addMsoWrappers from '../src/transforms/add-mso-wrappers.js';
import fixPreheader from '../src/transforms/fix-preheader.js';
import { clean } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORIGINAL_PATH = resolve(__dirname, '../../../email-onboarding-jnlf-2026.html');

/** Load original file as cheerio instance */
async function load() {
  const html = await readFile(ORIGINAL_PATH, 'utf-8');
  return cheerio.load(html, { xml: false, decodeEntities: false });
}

// --- Individual transform tests ---

describe('remove-data-attrs', async () => {
  it('should remove all data-* attributes', async () => {
    const $ = await load();
    const before = $('[data-block-id]').length + $('[data-testid]').length;
    assert.ok(before > 0, 'original should have data-* attributes');

    const result = removeDataAttrs($);
    assert.ok(result.removed > 0, 'should report removals');
    assert.equal($('[data-block-id]').length, 0, 'no data-block-id should remain');
    assert.equal($('[data-testid]').length, 0, 'no data-testid should remain');
  });
});

describe('remove-empty-tags', async () => {
  it('should remove <colgroup> elements', async () => {
    const $ = await load();
    const before = $('colgroup').length;
    assert.ok(before > 0, 'original should have colgroup elements');

    removeEmptyTags($);
    assert.equal($('colgroup').length, 0, 'no colgroup should remain');
  });

  it('should remove empty <div> elements', async () => {
    const $ = await load();
    removeEmptyTags($);

    $('div').each(function () {
      const text = $(this).text().trim();
      const hasContent = text.length > 0 || $(this).find('img, input, hr, br').length > 0;
      // All remaining divs should have content (unless they contain comments)
      const html = $(this).html() || '';
      if (!html.includes('<!--')) {
        assert.ok(hasContent, `empty div found: ${html.substring(0, 100)}`);
      }
    });
  });
});

describe('remove-google-fonts', async () => {
  it('should remove Google Fonts links', async () => {
    const $ = await load();
    const before = $('link').filter(function () {
      const href = $(this).attr('href') || '';
      return href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com');
    }).length;
    assert.ok(before > 0, 'original should have Google Fonts links');

    removeGoogleFonts($);

    const after = $('link').filter(function () {
      const href = $(this).attr('href') || '';
      return href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com');
    }).length;
    assert.equal(after, 0, 'no Google Fonts links should remain');
  });
});

describe('clean-classes', async () => {
  it('should remove Mailchimp editor classes', async () => {
    const $ = await load();
    assert.ok($('.mceWrapper').length > 0, 'original should have mceWrapper class');
    assert.ok($('.mceRow').length > 0, 'original should have mceRow class');
    assert.ok($('.imageDropZone').length > 0, 'original should have imageDropZone class');

    cleanClasses($);

    assert.equal($('.mceWrapper').length, 0, 'mceWrapper should be removed');
    assert.equal($('.mceRow').length, 0, 'mceRow should be removed');
    assert.equal($('.imageDropZone').length, 0, 'imageDropZone should be removed');
    assert.equal($('.mceGutterContainer').length, 0, 'mceGutterContainer should be removed');
  });

  it('should remove editor IDs', async () => {
    const $ = await load();
    assert.ok($('#b5').length > 0 || $('#b6').length > 0, 'original should have block IDs');

    cleanClasses($);

    assert.equal($('#b5').length, 0, 'b5 ID should be removed');
    assert.equal($('[id^="mceColumnId"]').length, 0, 'mceColumnId IDs should be removed');
    assert.equal($('[id^="gutterContainerId"]').length, 0, 'gutterContainerId IDs should be removed');
  });

  it('should preserve section classes', async () => {
    const $ = await load();
    cleanClasses($);

    assert.ok($('.mceSectionHeader').length > 0, 'mceSectionHeader should be preserved');
    assert.ok($('.mceSectionBody').length > 0, 'mceSectionBody should be preserved');
    assert.ok($('.mceSectionFooter').length > 0, 'mceSectionFooter should be preserved');
  });

  it('should preserve styling classes (mceText, mcnTextContent)', async () => {
    const $ = await load();
    assert.ok($('.mceText').length > 0, 'original should have mceText class');

    cleanClasses($);

    assert.ok($('.mceText').length > 0, 'mceText should be preserved (carries font/alignment)');
  });
});

describe('simplify-tables', async () => {
  it('should reduce table count', async () => {
    const $ = await load();
    const before = $('table').length;

    simplifyTables($);
    const after = $('table').length;

    assert.ok(after < before, `table count should decrease: ${before} -> ${after}`);
  });
});

describe('add-mso-wrappers', async () => {
  it('should add MSO wrappers to sections without them', async () => {
    // Wrap <td> in proper table context so cheerio doesn't strip it
    const $ = cheerio.load(`
      <table><tbody><tr>
        <td class="mceSectionHeader">
          <table style="max-width:660px"><tr><td>Header</td></tr></table>
        </td>
      </tr></tbody></table>
    `, { xml: false, decodeEntities: false });

    const result = addMsoWrappers($, { width: 660 });
    const html = $.html();
    assert.ok(html.includes('<!--[if (gte mso 9)|(IE)]>'), 'should add MSO open comment');
    assert.ok(html.includes('width="660"'), 'should use correct width');
    assert.ok(result.added > 0, 'should report additions');
  });

  it('should not duplicate existing MSO wrappers', async () => {
    const $ = cheerio.load(`
      <table><tbody><tr>
        <td class="mceSectionFooter">
          <!--[if (gte mso 9)|(IE)]><table width="660"><tr><td><![endif]-->
          <table style="max-width:660px"><tr><td>Footer</td></tr></table>
          <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
        </td>
      </tr></tbody></table>
    `, { xml: false, decodeEntities: false });

    const result = addMsoWrappers($, { width: 660 });
    assert.equal(result.added, 0, 'should not add duplicates');
  });
});

describe('fix-preheader', async () => {
  it('should add padding to preheader', async () => {
    const $ = await load();
    const result = fixPreheader($);

    assert.ok(result.modified, 'should report modification');

    const preheader = $('.mcnPreviewText').first();
    const html = preheader.html();
    // Cheerio decodes &#847; to U+034F, so check for the decoded character
    assert.ok(html.includes('\u034F') || html.includes('&#847;'), 'should contain padding characters');
  });

  it('should not double-pad', async () => {
    const $ = await load();
    fixPreheader($);
    const result2 = fixPreheader($);
    assert.equal(result2.modified, false, 'second pass should not modify');
  });
});

// --- Full pipeline test ---

describe('clean() full pipeline', async () => {
  it('should significantly reduce file size', async () => {
    const html = await readFile(ORIGINAL_PATH, 'utf-8');
    const result = await clean(html, { width: 660 });

    const originalSize = Buffer.byteLength(html, 'utf-8');
    const cleanedSize = Buffer.byteLength(result.html, 'utf-8');
    const reduction = 1 - cleanedSize / originalSize;

    assert.ok(reduction > 0.3, `should reduce size by >30%: got ${Math.round(reduction * 100)}%`);
  });

  it('should preserve all images', async () => {
    const html = await readFile(ORIGINAL_PATH, 'utf-8');
    const $original = cheerio.load(html, { xml: false, decodeEntities: false });
    const originalSrcs = new Set();
    $original('img').each(function () {
      const src = $original(this).attr('src');
      if (src) originalSrcs.add(src);
    });

    const result = await clean(html);
    const $cleaned = cheerio.load(result.html, { xml: false, decodeEntities: false });
    const cleanedSrcs = new Set();
    $cleaned('img').each(function () {
      const src = $cleaned(this).attr('src');
      if (src) cleanedSrcs.add(src);
    });

    for (const src of originalSrcs) {
      assert.ok(cleanedSrcs.has(src), `image should be preserved: ${src}`);
    }
  });

  it('should preserve all links', async () => {
    const html = await readFile(ORIGINAL_PATH, 'utf-8');
    const $original = cheerio.load(html, { xml: false, decodeEntities: false });
    const originalHrefs = new Set();
    $original('a[href]').each(function () {
      originalHrefs.add($original(this).attr('href'));
    });

    const result = await clean(html);
    const $cleaned = cheerio.load(result.html, { xml: false, decodeEntities: false });
    const cleanedHrefs = new Set();
    $cleaned('a[href]').each(function () {
      cleanedHrefs.add($cleaned(this).attr('href'));
    });

    for (const href of originalHrefs) {
      assert.ok(cleanedHrefs.has(href), `link should be preserved: ${href}`);
    }
  });

  it('should preserve template variables ${...}', async () => {
    const html = await readFile(ORIGINAL_PATH, 'utf-8');
    const result = await clean(html);

    assert.ok(result.html.includes('${lastname}'), '${lastname} should be preserved');
    assert.ok(result.html.includes('${firstname}'), '${firstname} should be preserved');
  });

  it('should preserve VML/MSO button markup', async () => {
    const html = await readFile(ORIGINAL_PATH, 'utf-8');
    const result = await clean(html);

    assert.ok(result.html.includes('v:roundrect'), 'VML roundrect should be preserved');
    assert.ok(result.html.includes('<!--[if mso]>'), 'MSO conditionals should be preserved');
  });
});
