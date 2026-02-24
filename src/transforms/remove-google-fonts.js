/**
 * Remove <link> elements pointing to Google Fonts (fonts.googleapis.com, fonts.gstatic.com).
 * Email clients don't reliably support web fonts — the font stack fallback is sufficient.
 */
export default function removeGoogleFonts($, _options) {
  let count = 0;

  $('link').each(function () {
    const href = $(this).attr('href') || '';
    if (href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com')) {
      $(this).remove();
      count++;
    }
  });

  // Also remove <link rel="preconnect"> for these domains
  $('link[rel="preconnect"]').each(function () {
    const href = $(this).attr('href') || '';
    if (href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com')) {
      $(this).remove();
      count++;
    }
  });

  return { name: 'remove-google-fonts', removed: count };
}
