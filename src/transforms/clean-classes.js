import { removeClasses, removeIdAttrs } from '../utils/html-helpers.js';

/**
 * Mailchimp editor classes to remove — these are editor UI / grid system artifacts.
 */
const EDITOR_CLASSES = [
  'imageDropZone',
  'mceGutterContainer',
  'mceLayoutContainer',
  'mceWrapper',
  'mceWrapperInner',
  'mceRow',
  'mceColumn',
  'mceColumn-1',
  'mceColumn-2',
  'mceColumn-3',
  'mceColumn-4',
  'mceColumn-forceSpan',
  'mceSpacerBlock',
  'mceClusterLayout',
  'mceLayout',
  'mceBlockContainer',
  'mceBlockContainerE2E',
  'mceImageBlockContainer',
  'mceTextBlockContainer',
  'mceDividerBlockContainer',
  'mceDividerContainer',
  'mceDividerBlock',
  'mceButtonBlockContainer',
  'mceButtonContainer',
  'mceWidthContainer',
  'mceReverseStack',
  'mceKeepColumns',
  // NOTE: mceText, mcnTextContent are NOT removed — they carry font-family,
  // text-align, color, font-size via CSS rules (.mceText p, .mceText h1, etc.)
  'mceInput',
  'mceErrorMessage',
  'mceImageBorder',
  'mceImage',
  'mceLogo',
  'mceSocialFollowIcon',
  'mceSpacing-24',
  'mceSpacing-12',
  'last-child',
  'mobile-native',
];

/**
 * Editor ID patterns to remove:
 * - b5, b6, b-5, b-2 etc (block IDs)
 * - d5, d8, d13 etc (div IDs)
 * - mceColumnId-* (column IDs)
 * - gutterContainerId-* (gutter IDs)
 * - section_* (section IDs)
 * - bodyTable, root
 */
const EDITOR_ID_PATTERN = /^(b-?\d+|d\d+|mceColumnId-|gutterContainerId-|section_|bodyTable$|root$)/;

/**
 * Remove Mailchimp editor classes and IDs that are not needed for rendering.
 */
export default function cleanClasses($, _options) {
  const classCount = removeClasses($, EDITOR_CLASSES);
  const idCount = removeIdAttrs($, EDITOR_ID_PATTERN);
  return { name: 'clean-classes', classesRemoved: classCount, idsRemoved: idCount };
}
