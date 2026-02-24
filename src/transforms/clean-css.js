/**
 * Purge unused/editor-only CSS from the <style> block.
 *
 * Strategy:
 * 1. Parse CSS into rules (selector + body)
 * 2. Remove rules whose selectors only target editor classes/IDs
 * 3. Remove empty media queries
 * 4. Clean up whitespace
 */

/**
 * Selector patterns that are editor-only and should always be removed.
 */
const EDITOR_SELECTOR_PATTERNS = [
  /\.mceInput/,
  /\.mceLabel/,
  /\.mceErrorMessage/,
  /div\[contenteditable/,
  /\.mceImageBorder/,
  /\.mceColumn[\s,{.-]/,
  /\.mceColumn-\d/,
  /\.mceColumn-forceSpan/,
  /\.mceKeepColumns/,
  /\.mceBlockContainer/,
  /\.mceBlockContainerE2E/,
  // NOTE: .mceText and .mcnTextContent are NOT removed — their CSS rules carry
  // font-family, font-size, text-align, color for p, h1, h2, a descendants.
  /\.mceWidthContainer/,
  /\.mceReverseStack/,
  /\.mceFooterSection\s/,
  /\.mceLogo/,
  /\.mceSocialFollowIcon/,
  /\.mceSpacing/,
  /\.mceButtonContainer/,
  /\.mceDividerContainer/,
  /\.mceButtonLink/,
  /\.mobile-native/,
  /body\.mobile-native/,
  /#bodyTable/,
  /#root\b/,
  /#b-?\d+/,
  /#d\d+/,
  /#mceColumnId/,
  /#gutterContainerId/,
  /#section_/,
  /colgroup/,
  /\.mceImage[\s,{]/,
  /\.imageDropZone/,
  /\.mceGutterContainer/,
  /\.mceLayoutContainer/,
  /\.mceLayout[\s,{]/,
  /\.mceWrapper(?:Inner)?[\s,{]/,
  /\.mceRow[\s,{]/,
  /\.mceSpacerBlock/,
  /\.mceClusterLayout/,
  /\.mceTextBlockContainer/,
  /\.mceImageBlockContainer/,
  /\.mceDividerBlockContainer/,
  /\.mceButtonBlockContainer/,
  /\.last-child/,
];

/**
 * Parse CSS text into an array of top-level blocks.
 * Each block is either a rule { type: 'rule', selector, body }
 * or a media query { type: 'media', query, content, rules }.
 */
function parseCssBlocks(css) {
  const blocks = [];
  let i = 0;

  while (i < css.length) {
    // Skip whitespace
    while (i < css.length && /\s/.test(css[i])) i++;
    if (i >= css.length) break;

    // Check for @media
    if (css.startsWith('@media', i)) {
      const queryStart = i;
      const braceIdx = css.indexOf('{', i);
      if (braceIdx === -1) break;
      const query = css.substring(i, braceIdx).trim();

      // Find matching closing brace
      let depth = 1;
      let j = braceIdx + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      const content = css.substring(braceIdx + 1, j - 1).trim();
      blocks.push({ type: 'media', query, content, raw: css.substring(queryStart, j) });
      i = j;
    } else {
      // Regular rule
      const braceIdx = css.indexOf('{', i);
      if (braceIdx === -1) break;
      const selector = css.substring(i, braceIdx).trim();

      let depth = 1;
      let j = braceIdx + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      const body = css.substring(braceIdx + 1, j - 1).trim();
      blocks.push({ type: 'rule', selector, body, raw: css.substring(i, j) });
      i = j;
    }
  }

  return blocks;
}

/**
 * Check if a CSS selector group should be removed.
 */
function isEditorSelector(selectorGroup) {
  // Split comma-separated selectors
  const selectors = selectorGroup.split(',').map(s => s.trim());

  // Remove the entire rule if ALL selectors are editor-only
  return selectors.every(sel =>
    EDITOR_SELECTOR_PATTERNS.some(pattern => pattern.test(sel))
  );
}

export default function cleanCss($, _options) {
  const styleEl = $('style').first();
  if (!styleEl.length) return { name: 'clean-css', removed: 0 };

  let css = styleEl.html();
  if (!css) return { name: 'clean-css', removed: 0 };

  const originalLen = css.length;

  // Parse and filter top-level blocks
  const blocks = parseCssBlocks(css);
  const kept = [];

  for (const block of blocks) {
    if (block.type === 'rule') {
      if (!isEditorSelector(block.selector)) {
        kept.push(block.raw);
      }
    } else if (block.type === 'media') {
      // Parse inner rules of media query
      const innerBlocks = parseCssBlocks(block.content);
      const keptInner = [];

      for (const inner of innerBlocks) {
        if (inner.type === 'rule' && !isEditorSelector(inner.selector)) {
          keptInner.push(inner.raw);
        }
      }

      if (keptInner.length > 0) {
        kept.push(`${block.query} {\n${keptInner.join('\n')}\n}`);
      }
    }
  }

  const finalCss = kept.join('\n\n');
  styleEl.html('\n' + finalCss + '\n');

  return {
    name: 'clean-css',
    originalSize: originalLen,
    cleanedSize: finalCss.length,
    removed: originalLen - finalCss.length,
  };
}
