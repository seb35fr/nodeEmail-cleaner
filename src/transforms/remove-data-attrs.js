/**
 * Remove all data-* attributes from every element.
 * Mailchimp editor adds data-block-id, data-testid, etc.
 */
export default function removeDataAttrs($, _options) {
  let count = 0;
  $('*').each(function () {
    const el = $(this);
    const attribs = el.attr();
    if (!attribs) return;
    for (const key of Object.keys(attribs)) {
      if (key.startsWith('data-')) {
        el.removeAttr(key);
        count++;
      }
    }
  });
  return { name: 'remove-data-attrs', removed: count };
}
