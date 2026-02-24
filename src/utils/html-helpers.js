/**
 * Shared helpers for cheerio-based HTML manipulation.
 */

/**
 * Remove an attribute from all elements matching a selector.
 * @param {import('cheerio').CheerioAPI} $ - Cheerio instance
 * @param {string} selector - CSS selector
 * @param {string} attr - Attribute name to remove
 * @returns {number} Number of attributes removed
 */
export function removeAttr($, selector, attr) {
  let count = 0;
  $(selector).each(function () {
    if ($(this).attr(attr) !== undefined) {
      $(this).removeAttr(attr);
      count++;
    }
  });
  return count;
}

/**
 * Remove elements matching a selector.
 * @param {import('cheerio').CheerioAPI} $ - Cheerio instance
 * @param {string} selector - CSS selector
 * @returns {number} Number of elements removed
 */
export function removeElements($, selector) {
  const els = $(selector);
  const count = els.length;
  els.remove();
  return count;
}

/**
 * Check if an element is visually empty (only whitespace / empty children).
 * @param {import('cheerio').CheerioAPI} $
 * @param {import('cheerio').Cheerio} el
 * @returns {boolean}
 */
export function isEmptyElement($, el) {
  return $(el).text().trim() === '' && $(el).find('img, input, hr, br').length === 0;
}

/**
 * Remove a list of class names from all elements that have them.
 * Also removes the class attribute entirely if it becomes empty.
 * @param {import('cheerio').CheerioAPI} $
 * @param {string[]} classNames
 * @returns {number} Total class removals
 */
export function removeClasses($, classNames) {
  let count = 0;
  for (const cls of classNames) {
    const els = $(`.${cls}`);
    els.each(function () {
      $(this).removeClass(cls);
      count++;
    });
  }
  // Clean up empty class attributes
  $('[class]').each(function () {
    const val = $(this).attr('class');
    if (val !== undefined && val.trim() === '') {
      $(this).removeAttr('class');
    }
  });
  return count;
}

/**
 * Remove elements matching IDs by pattern (regex test on id attribute).
 * @param {import('cheerio').CheerioAPI} $
 * @param {RegExp} pattern
 * @returns {number}
 */
export function removeIdAttrs($, pattern) {
  let count = 0;
  $('[id]').each(function () {
    const id = $(this).attr('id');
    if (id && pattern.test(id)) {
      $(this).removeAttr('id');
      count++;
    }
  });
  return count;
}
