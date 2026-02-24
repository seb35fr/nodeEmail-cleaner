/**
 * Add MSO (Outlook) conditional wrappers around main sections.
 * Detects sections by class: mceSectionHeader, mceSectionBody, mceSectionFooter.
 * Wraps their inner max-width table with:
 *   <!--[if (gte mso 9)|(IE)]><table width="660" ...><tr><td><![endif]-->
 *   ... content ...
 *   <!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->
 */
export default function addMsoWrappers($, options = {}) {
  const width = options.width || 660;
  let count = 0;

  const sectionClasses = ['mceSectionHeader', 'mceSectionBody', 'mceSectionFooter'];

  for (const cls of sectionClasses) {
    $(`.${cls}`).each(function () {
      const section = $(this);
      const html = $.html(section);

      // Check if MSO wrapper already exists
      if (html.includes('<!--[if (gte mso 9)|(IE)]>')) return;

      // Find the inner max-width table
      const innerTable = section.children('table[style*="max-width"]').first();
      if (!innerTable.length) return;

      // Add MSO wrapper before and after the inner table
      const msoOpen = `<!--[if (gte mso 9)|(IE)]><table align="center" border="0" cellspacing="0" cellpadding="0" width="${width}"><tr><td><![endif]-->`;
      const msoClose = `<!--[if (gte mso 9)|(IE)]></td></tr></table><![endif]-->`;

      innerTable.before(msoOpen);
      innerTable.after(msoClose);
      count++;
    });
  }

  return { name: 'add-mso-wrappers', added: count };
}
