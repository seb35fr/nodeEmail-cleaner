/**
 * Simplify nested table structures.
 * Mailchimp generates deeply nested <table><tbody><tr><td> wrappers
 * where a single cell wraps another table. When a wrapping table adds
 * no visual style (no background-color, no padding, no meaningful attributes),
 * we can "unwrap" it — replacing the outer table with its inner content.
 *
 * We also remove empty <tbody> elements left behind.
 */

/**
 * Check if a style string has any visually significant property
 * (background-color other than transparent, meaningful padding, etc.).
 */
function hasSignificantStyle(style) {
  if (!style) return false;

  // Parse style into key-value pairs
  const props = {};
  for (const decl of style.split(';')) {
    const [key, ...valParts] = decl.split(':');
    if (key && valParts.length) {
      props[key.trim().toLowerCase()] = valParts.join(':').trim().toLowerCase();
    }
  }

  // Check for meaningful background-color
  const bg = props['background-color'];
  if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgba(0,0,0,0)') {
    return true;
  }

  // Check for meaningful padding (non-zero)
  for (const key of Object.keys(props)) {
    if (key.startsWith('padding')) {
      const val = props[key];
      if (val && val !== '0' && val !== '0px' && val !== '0;') {
        // Check if ALL padding values are zero
        const parts = val.replace(/;/g, '').split(/\s+/);
        if (parts.some(p => p !== '0' && p !== '0px')) {
          return true;
        }
      }
    }
  }

  // Check for border
  const border = props['border'];
  if (border && border !== '0' && border !== 'none' && border !== '0px') {
    return true;
  }

  return false;
}

export default function simplifyTables($, _options) {
  let count = 0;

  // Remove empty <tbody> elements
  $('tbody').each(function () {
    if ($(this).children().length === 0) {
      $(this).remove();
      count++;
    }
  });

  // Simplify wrapping tables: a <table> with a single <tbody><tr><td> containing
  // exactly one child table, where the outer table adds no visual style
  let changed = true;
  let passes = 0;
  const maxPasses = 10;

  while (changed && passes < maxPasses) {
    changed = false;
    passes++;

    $('table').each(function () {
      const table = $(this);
      const tbody = table.children('tbody');
      if (tbody.length !== 1) return;

      const rows = tbody.children('tr');
      if (rows.length !== 1) return;

      const cells = rows.children('td');
      if (cells.length !== 1) return;

      const cell = cells.first();
      const cellStyle = cell.attr('style') || '';

      // Don't unwrap if the cell has significant style
      if (hasSignificantStyle(cellStyle)) return;

      // Don't unwrap if it has colspan (meaningful grid layout)
      const colspan = cell.attr('colspan');
      if (colspan && colspan !== '1' && colspan !== '12') return;

      // Get inner content
      const children = cell.children();

      // If the cell contains exactly one table, unwrap
      if (children.length === 1 && children.first().is('table')) {
        const innerTable = children.first();
        table.replaceWith(innerTable);
        count++;
        changed = true;
        return;
      }

      // If the cell is empty (no content at all), remove the whole table
      if (cell.text().trim() === '' && children.length === 0) {
        table.remove();
        count++;
        changed = true;
      }
    });
  }

  return { name: 'simplify-tables', simplified: count, passes };
}
