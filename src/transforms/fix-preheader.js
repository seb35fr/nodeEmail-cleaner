/**
 * Fix preheader text with anti-preview padding.
 * Finds the preheader span (class mcnPreviewText or display:none with text)
 * and appends &#847;&zwnj;&nbsp; × 40 to prevent email clients from pulling
 * body text into the preview.
 */
const PADDING_CHAR = '&#847;&zwnj;&nbsp;';
const PADDING_COUNT = 40;

// Cheerio decodes &#847; to U+034F (combining grapheme joiner)
// and &zwnj; to U+200C — check for both encoded and decoded forms
const DECODED_MARKER = '\u034F';  // ͏

export default function fixPreheader($, _options) {
  // Look for known preheader patterns
  let preheader = $('.mcnPreviewText').first();

  if (!preheader.length) {
    // Fallback: find span/div with display:none that contains text
    $('span, div').each(function () {
      const style = $(this).attr('style') || '';
      if (style.includes('display:none') || style.includes('display: none')) {
        const text = $(this).text().trim();
        if (text.length > 0) {
          preheader = $(this);
          return false; // break
        }
      }
    });
  }

  if (!preheader.length) {
    return { name: 'fix-preheader', modified: false };
  }

  const currentHtml = preheader.html();

  // Check if padding already exists (either encoded or decoded form)
  if (currentHtml && (currentHtml.includes('&#847;') || currentHtml.includes(DECODED_MARKER))) {
    return { name: 'fix-preheader', modified: false, reason: 'already padded' };
  }

  // Append padding
  const padding = PADDING_CHAR.repeat(PADDING_COUNT);
  preheader.html((currentHtml || '') + padding);

  return { name: 'fix-preheader', modified: true };
}
