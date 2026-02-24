/**
 * nodeEmail-cleaner — Public API
 *
 * Cleans Mailchimp HTML email exports by running a pipeline of transforms.
 */
import * as cheerio from 'cheerio';
import removeDataAttrs from './transforms/remove-data-attrs.js';
import removeEmptyTags from './transforms/remove-empty-tags.js';
import removeGoogleFonts from './transforms/remove-google-fonts.js';
import cleanCss from './transforms/clean-css.js';
import cleanClasses from './transforms/clean-classes.js';
import simplifyTables from './transforms/simplify-tables.js';
import addMsoWrappers from './transforms/add-mso-wrappers.js';
import fixPreheader from './transforms/fix-preheader.js';

/**
 * Default transform pipeline — executed in order.
 */
const DEFAULT_PIPELINE = [
  removeDataAttrs,
  removeEmptyTags,
  removeGoogleFonts,
  cleanClasses,
  cleanCss,
  simplifyTables,
  addMsoWrappers,
  fixPreheader,
];

/**
 * Clean a Mailchimp HTML email export.
 *
 * @param {string} html - Raw HTML string
 * @param {object} [options] - Options
 * @param {number} [options.width=660] - Max width for MSO wrappers
 * @param {boolean} [options.msoWrappers=true] - Add MSO conditional wrappers
 * @param {boolean} [options.preheaderFix=true] - Fix preheader padding
 * @param {boolean} [options.cssClean=true] - Purge unused CSS
 * @returns {{ html: string, stats: object[] }} Cleaned HTML and per-transform stats
 */
export async function clean(html, options = {}) {
  const {
    width = 660,
    msoWrappers = true,
    preheaderFix = true,
    cssClean = true,
  } = options;

  // Load HTML with cheerio — use xmlMode:false to preserve HTML entities and comments
  const $ = cheerio.load(html, {
    xml: false,
    decodeEntities: false,
  });

  // Build active pipeline based on options
  const pipeline = DEFAULT_PIPELINE.filter(fn => {
    if (fn === addMsoWrappers && !msoWrappers) return false;
    if (fn === fixPreheader && !preheaderFix) return false;
    if (fn === cleanCss && !cssClean) return false;
    return true;
  });

  const stats = [];

  for (const transform of pipeline) {
    const result = transform($, { width });
    stats.push(result);
  }

  const output = $.html();

  return { html: output, stats };
}
