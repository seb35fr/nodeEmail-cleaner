import { isEmptyElement } from '../utils/html-helpers.js';

/**
 * Remove empty <div> elements (whitespace-only content, no meaningful children),
 * <colgroup> and <col> elements.
 */
export default function removeEmptyTags($, _options) {
  let count = 0;

  // Remove <colgroup> and <col> elements
  $('colgroup').each(function () {
    $(this).remove();
    count++;
  });
  $('col').each(function () {
    $(this).remove();
    count++;
  });

  // Remove empty <div> elements (multiple passes for nested empties)
  let found = true;
  while (found) {
    found = false;
    $('div').each(function () {
      if (isEmptyElement($, this)) {
        $(this).remove();
        count++;
        found = true;
      }
    });
  }

  return { name: 'remove-empty-tags', removed: count };
}
