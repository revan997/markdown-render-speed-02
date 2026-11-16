// Fast, faithful port of marked 18.1.3 (MIT, MarkedJS) — cursor-based.
// Same grammars, token rules and renderer output as marked with its default
// options (gfm on, breaks off, pedantic off, async off). No dependencies.
// Block and inline lexing run on sticky regexes anchored at a cursor instead
// of repeatedly slicing the remaining source.

const noopTest = { exec: () => null };

function cachedIndentRegex(createRegex) {
  const cache = [];
  return (indent) => {
    const cacheIndex = Math.max(0, Math.min(3, indent - 1));
    let regex = cache[cacheIndex];
    if (!regex) {
      regex = createRegex(cacheIndex);
      cache[cacheIndex] = regex;
    }
    return regex;
  };
}

function edit(regex, opt = '') {
  let source = typeof regex === 'string' ? regex : regex.source;
  const obj = {
    replace: (name, val) => {
      let valSource = typeof val === 'string' ? val : val.source;
      valSource = valSource.replace(other.caret, '$1');
      source = source.replace(name, valSource);
      return obj;
    },
    getRegex: () => new RegExp(source, opt),
  };
  return obj;
}

const supportsLookbehind = ((a = '') => {
  try { return !!new RegExp('(?<=1)(?<!1)' + a); } catch { return false; }
})();

const other = {
  codeRemoveIndent: /^(?: {0,3}\t| {1,4})/gm,
  outputLinkReplace: /\\([\[\]])/g,
  indentCodeCompensation: /^(\s+)(?:```)/,
  beginningSpace: /^\s+/,
  endingHash: /#$/,
  startingSpaceChar: /^ /,
  endingSpaceChar: / $/,
  endingSpaceTabChar: /[ \t]$/,
  nonSpaceChar: /[^ ]/,
  newLineCharGlobal: /\n/g,
  tabCharGlobal: /\t/g,
  leadingSpaceTab: /^[ \t]+/,
  multipleSpaceGlobal: /\s+/g,
  blankLine: /^[ \t]*$/,
  doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
  blockquoteStart: /^ {0,3}>/,
  blockquoteSetextReplace: /\n {0,3}((?:=+|-+)[ \t]*)(?=\n|$)/g,
  blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
  blockquoteMarkerWhitespace: /^( {0,3}>)([ \t]+)/gm,
  listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
  listIsTask: /^\[[ xX]\][ \t]+\S/,
  listReplaceTask: /^\[[ xX]\][ \t]+/,
  listTaskCheckbox: /\[[ xX]\]/,
  anyLine: /\n.*\n/,
  hrefBrackets: /^<(.*)>$/,
  tableDelimiter: /[:|]/,
  tableAlignChars: /^\||\| *$/g,
  tableRowBlankLine: /\n[ \t]*$/,
  tableAlignRight: /^ *-+: *$/,
  tableAlignCenter: /^ *:-+: *$/,
  tableAlignLeft: /^ *:-+ *$/,
  startATag: /^<a /i,
  endATag: /^<\/a>/i,
  startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
  endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
  startAngleBracket: /^</,
  endAngleBracket: />$/,
  pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
  unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
  numericCharacterReference: /&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));/,
  numericCharacterReferenceOrAmpersand: /&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
  escapeTest: /[&<>"']/,
  escapeReplace: /[&<>"']/g,
  escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
  escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
  caret: /(^|[^\[])\^/g,
  percentDecode: /%25/g,
  findPipe: /\|/g,
  splitPipe: / \|/,
  slashPipe: /\\\|/g,
  carriageReturn: /\r\n|\r/g,
  spaceLine: /^ +$/gm,
  notSpaceStart: /^\S*/,
  endingNewline: /\n$/,
  listItemRegex: (bull) => new RegExp(`^( {0,3}${bull})((?:[\t ][^\n]*)?(?:\n|$))`),
  nextBulletRegex: cachedIndentRegex((indent) => new RegExp(`^ {0,${indent}}(?:[*+-]|\\d{1,9}[.)])((?:[ \t][^\\n]*)?(?:\\n|$))`)),
  hrRegex: cachedIndentRegex((indent) => new RegExp(`^ {0,${indent}}((?:-[ \t]*){3,}|(?:_[ \t]*){3,}|(?:\\*[ \t]*){3,})(?:\\n+|$)`)),
  fencesBeginRegex: cachedIndentRegex((indent) => new RegExp(`^ {0,${indent}}(?:\`\`\`|~~~)`)),
  headingBeginRegex: cachedIndentRegex((indent) => new RegExp(`^ {0,${indent}}#{1,6}(?:\\s|$)`)),
  htmlBeginRegex: cachedIndentRegex((indent) => new RegExp(`^ {0,${indent}}(?:</?(?:${_tag})(?: +|$|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)`, 'i')),
  blockquoteBeginRegex: cachedIndentRegex((indent) => new RegExp(`^ {0,${indent}}>`)),
};

// ---- Block grammar (GFM) ----
const newline = /^(?:[ \t]*(?:\n|$))+/;
const blockCode = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
const fences = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}(?:(?=`)\1`*|(?=~)\1~*) *(?=\n|$)|$)/;
const hr = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
const heading = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
const bullet = / {0,3}(?:[*+-]|\d{1,9}[.)])/;
const lheadingCore = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |fences|blockquote|heading|hr|html|table))+?)\n {0,3}(=+|-+)[ \t]*(?:\n+|$)/;
const lheadingGfm = edit(lheadingCore)
  .replace(/bull/g, bullet)
  .replace(/blockCode/g, /(?: {4}| {0,3}\t)/)
  .replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/)
  .replace(/blockquote/g, / {0,3}>/)
  .replace(/heading/g, / {0,3}#{1,6}(?:\s|$)/)
  .replace(/hr/g, / {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/)
  .replace(/html/g, / {0,3}<[^\n>]+>\n/)
  .replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/)
  .getRegex();
const _paragraph = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/;
const blockText = /^[^\n]+/;
const _blockLabel = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\\n]|\n(?![ \t]*\n))+/;
const def = edit(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/)
  .replace('label', _blockLabel)
  .replace('title', /(?:"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\\n]|\n(?!\n))*'|\((?:\\[\s\S]|[^()\\])*\))/)
  .getRegex();
const list = edit(/^(bull)([ \t][^\n]*?)?(?:\n|$)/)
  .replace(/bull/g, bullet)
  .getRegex();
const _tag = 'address|article|aside|base|basefont|blockquote|body|caption'
  + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
  + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
  + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
  + '|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title'
  + '|tr|track|ul';
const _comment = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
const html = edit(
  '^ {0,3}(?:'
  + '<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)'
  + '|comment[^\\n]*(\\n+|$)'
  + '|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)'
  + '|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)'
  + '|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)'
  + '|</?(tag)(?:[ \\t]+|\\n|/?>|$)[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)'
  + '|<(?!(?:script|pre|style|textarea)(?![a-z0-9-]))([a-z][a-z0-9-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)'
  + '|</[a-z][a-z0-9-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)'
  + ')', 'i')
  .replace('comment', _comment)
  .replace('tag', _tag)
  .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
  .getRegex();
const gfmTable = edit(
  '^ *([^\\n ].*)\\n'
  + ' {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)'
  + '(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)')
  .replace('hr', hr)
  .replace('heading', ' {0,3}#{1,6}(?:\\s|$)')
  .replace('blockquote', ' {0,3}>')
  .replace('code', '(?: {4}| {0,3}\t)[^\\n]')
  .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)')
  .replace('list', ' {0,3}(?:[*+-]|1[.)])[ \\t]')
  .replace('html', ' {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)')
  .replace('tag', _tag)
  .getRegex();
const paragraphGfm = edit(_paragraph)
  .replace('hr', hr)
  .replace('heading', ' {0,3}#{1,6}(?:\\s|$)')
  .replace('|lheading', '')
  .replace('table', gfmTable)
  .replace('blockquote', ' {0,3}>')
  .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)')
  .replace('list', ' {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]')
  .replace('html', ' {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)')
  .replace('tag', _tag)
  .getRegex();
const blockquoteParagraph = edit(_paragraph)
  .replace('hr', hr)
  .replace('heading', ' {0,3}#{1,6}(?:\\s|$)')
  .replace('|lheading', '')
  .replace('|table', '')
  .replace('blockquote', ' {0,3}>')
  .replace('fences', ' {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)')
  .replace('list', ' {0,3}(?:[*+-]|\\d{1,9}[.)])(?:[ \\t]|\\n|$)')
  .replace('html', ' {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)')
  .replace('tag', _tag)
  .getRegex();
const blockquote = edit(/^( {0,3}> ?(?:(?![ \t]*(?:\n|$))(paragraph)|[^\n]*)(?:\n|$))+/)
  .replace('paragraph', blockquoteParagraph)
  .getRegex();

const block = {
  blockquote, code: blockCode, def, fences, heading, hr, html,
  lheading: lheadingGfm, list, newline, paragraph: paragraphGfm,
  table: gfmTable, text: blockText,
};

// ---- Inline grammar (GFM) ----
const escape = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
const inlineCode = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
const br = /^( {2,}|\\)\n(?!\s*$)[ \t]*/;
const _punctuation = /[\p{P}\p{S}]/u;
const _punctuationOrSpace = /[\s\p{P}\p{S}]/u;
const _notPunctuationOrSpace = /[^\s\p{P}\p{S}]/u;
const punctuation = edit(/^((?![*_])punctSpace)/, 'u')
  .replace(/punctSpace/g, _punctuationOrSpace).getRegex();
const _punctuationGfmStrongEm = /(?!~)[\p{P}\p{S}]/u;
const _punctuationOrSpaceGfmStrongEm = /(?!~)[\s\p{P}\p{S}]/u;
const _notPunctuationOrSpaceGfmStrongEm = /(?:[^\s\p{P}\p{S}]|~)/u;
const blockSkip = edit(/link|precode-code|html/, 'g')
  .replace('link', /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/)
  .replace('precode-', supportsLookbehind ? '(?<!`)()' : '(^^|[^`])')
  .replace('code', /(?<b>`+)[^`]+\k<b>(?!`)/)
  .replace('html', /<(?! )[^<>]*?>/)
  .getRegex();
const emStrongLDelimCore = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/;
const emStrongLDelim = edit(emStrongLDelimCore, 'u')
  .replace(/punct/g, _punctuationGfmStrongEm)
  .getRegex();
const emStrongRDelimAstCore =
  '^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)' // Skip orphan inside strong
  + '|[^*]+(?=[^*])' // Consume to delim
  + '|(?!\\*)punct(\\*+)(?=[\\s]|$)' // (1)
  + '|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)' // (2)
  + '|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)' // (3)
  + '|[\\s](\\*+)(?!\\*)(?=punct)' // (4)
  + '|(?!\\*)punct(\\*+)(?!\\*)(?=punct)' // (5)
  + '|notPunctSpace(\\*+)(?=notPunctSpace)'; // (6)
const emStrongRDelimAst = edit(emStrongRDelimAstCore, 'gu')
  .replace(/notPunctSpace/g, _notPunctuationOrSpaceGfmStrongEm)
  .replace(/punctSpace/g, _punctuationOrSpaceGfmStrongEm)
  .replace(/punct/g, _punctuationGfmStrongEm)
  .getRegex();
const emStrongRDelimUnd = edit(
  '^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)'
  + '|[^_]+(?=[^_])'
  + '|(?!_)punct(_+)(?=[\\s]|$)'
  + '|notPunctSpace(_+)(?!_)(?=punctSpace|$)'
  + '|(?!_)punctSpace(_+)(?=notPunctSpace)'
  + '|[\\s](_+)(?!_)(?=punct)'
  + '|(?!_)punct(_+)(?!_)(?=punct)', 'gu')
  .replace(/notPunctSpace/g, _notPunctuationOrSpace)
  .replace(/punctSpace/g, _punctuationOrSpace)
  .replace(/punct/g, _punctuation)
  .getRegex();
const delLDelim = edit(/^~~?(?:((?!~)punct)|[^\s~])/, 'u')
  .replace(/punct/g, _punctuation)
  .getRegex();
const delRDelimCore =
  '^[^~]+(?=[^~])'
  + '|(?!~)punct(~~?)(?=[\\s]|$)'
  + '|notPunctSpace(~~?)(?!~)(?=punctSpace|$)'
  + '|(?!~)punctSpace(~~?)(?=notPunctSpace)'
  + '|[\\s](~~?)(?!~)(?=punct)'
  + '|(?!~)punct(~~?)(?!~)(?=punct)'
  + '|notPunctSpace(~~?)(?=notPunctSpace)';
const delRDelim = edit(delRDelimCore, 'gu')
  .replace(/notPunctSpace/g, _notPunctuationOrSpace)
  .replace(/punctSpace/g, _punctuationOrSpace)
  .replace(/punct/g, _punctuation)
  .getRegex();
const anyPunctuation = edit(/\\(punct)/, 'gu')
  .replace(/punct/g, _punctuation)
  .getRegex();
const anyPunctuationOutsideCode = edit(/(`+)(?:[^`]|[^`][\s\S]*?[^`])\1(?!`)|`+|\\(punct)/, 'gu')
  .replace(/punct/g, _punctuation)
  .getRegex();
const autolink = edit(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/)
  .replace('scheme', /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/)
  .replace('email', /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/)
  .getRegex();
const _inlineComment = edit(_comment).replace('(?:-->|$)', '-->').getRegex();
const tag = edit(
  '^comment'
  + '|^</[a-zA-Z][a-zA-Z0-9-]*\\s*>'
  + '|^<[a-zA-Z][a-zA-Z0-9-]*(?:attribute)*?\\s*/?>'
  + '|^<\\?[\\s\\S]*?\\?>'
  + '|^<![a-zA-Z]+\\s[\\s\\S]*?>'
  + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>')
  .replace('comment', _inlineComment)
  .replace('attribute', /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/)
  .getRegex();
const _inlineLabelBrackets = /\[(?:\\[\s\S]|[^\[\]\\])*\]/;
const _inlineLabel = edit(/(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/)
  .replace('brackets', _inlineLabelBrackets)
  .getRegex();
const link = edit(/^!?\[(label)\]\([ \t\n]*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?[ \t\n]*\)/)
  .replace('label', _inlineLabel)
  .replace('href', /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/)
  .replace('title', /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\((?:\\[\s\S]|[^)\\])*\)/)
  .getRegex();
const reflink = edit(/^!?\[(label)\]\[(ref)\]/)
  .replace('label', _inlineLabel)
  .replace('ref', _blockLabel)
  .getRegex();
const nolink = edit(/^!?\[(ref)\](?:\[\])?/)
  .replace('ref', _blockLabel)
  .getRegex();
const _boundedBlockLabel = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\]){1,999}/;
const _boundedInlineLabel = edit(/(?:[^\[\]\\`]*(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\]))){0,999}?[^\[\]\\`]*?/)
  .replace('brackets', _inlineLabelBrackets)
  .getRegex();
const reflinkSearch = edit('reflink|nolink(?!\\()', 'g')
  .replace('reflink', edit(/^!?\[(label)\]\[(ref)\]/)
    .replace('label', _boundedInlineLabel)
    .replace('ref', _boundedBlockLabel)
    .getRegex())
  .replace('nolink', edit(/^!?\[(ref)\](?:\[\])?/)
    .replace('ref', _boundedBlockLabel)
    .getRegex())
  .getRegex();
const _caseInsensitiveProtocol = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
const _extendedEmail = /[A-Za-z0-9._+-]+@[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/;
const _extendedEmailProtocol = edit(/(?:mailto:email|xmpp:email(?:\/[A-Za-z0-9@.]+)?)/)
  .replace(/email/g, _extendedEmail)
  .getRegex();
const inline = {
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  anyPunctuation,
  anyPunctuationOutsideCode,
  autolink,
  blockSkip,
  br,
  code: inlineCode,
  del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
  delLDelim,
  delRDelim,
  emStrongLDelim,
  emStrongRDelimAst,
  emStrongRDelimUnd,
  escape,
  link,
  nolink,
  punctuation,
  reflink,
  reflinkSearch,
  tag,
  text: edit(/^(?:[^a-zA-Z0-9](?=emailProtocol)|(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|wwwStart|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9](?=emailProtocol)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))))/)
    .replace('protocol', _caseInsensitiveProtocol)
    .replace(/emailProtocol/g, /(?:mailto|xmpp):/)
    .replace('wwwStart', supportsLookbehind ? '(?<![^\\s*_~(])www\\.' : 'www\\.')
    .getRegex(),
  url: edit(/^emailProtocol|^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/)
    .replace('emailProtocol', _extendedEmailProtocol)
    .replace('protocol', _caseInsensitiveProtocol)
    .replace('email', /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/)
    .getRegex(),
};

// Sticky clones of the anchored tokenizer regexes. Every start-of-string
// anchor outside a character class is dropped (the y flag anchors the match
// at lastIndex instead); ^ inside [...] (negation) and escaped \^ are kept.
// The originals stay for .test()/.replace()/matchAll uses on arbitrary strings.
function sy(re) {
  const flags = re.flags.replace('g', '').replace('m', '') + 'y';
  const src = re.source;
  let out = '';
  let inClass = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '\\') {
      out += src.slice(i, i + 2);
      i++;
      continue;
    }
    if (ch === '[') inClass = true;
    else if (ch === ']') inClass = false;
    else if (ch === '^' && !inClass) continue;
    out += ch;
  }
  return new RegExp(out, flags);
}
function ex(re, src, pos) {
  re.lastIndex = pos;
  return re.exec(src);
}
const blockY = {
  blockquote: sy(block.blockquote), code: sy(block.code), def: sy(block.def),
  fences: sy(block.fences), heading: sy(block.heading), hr: sy(block.hr),
  html: sy(block.html), lheading: sy(block.lheading), list: sy(block.list),
  newline: sy(block.newline), paragraph: sy(block.paragraph),
  table: sy(block.table), text: sy(block.text),
};
const inlineY = {
  autolink: sy(inline.autolink), br: sy(inline.br), code: sy(inline.code),
  del: sy(inline.del), delLDelim: sy(inline.delLDelim),
  emStrongLDelim: sy(inline.emStrongLDelim), escape: sy(inline.escape),
  link: sy(inline.link), nolink: sy(inline.nolink),
  reflink: sy(inline.reflink), tag: sy(inline.tag), text: sy(inline.text),
  url: sy(inline.url),
};
const listItemRegexCache = new Map();
function listItemRegexSticky(bull) {
  let re = listItemRegexCache.get(bull);
  if (!re) {
    re = sy(other.listItemRegex(bull));
    listItemRegexCache.set(bull, re);
  }
  return re;
}

// ---- Helpers ----
const escapeReplacements = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};
const getEscapeReplacement = (ch) => escapeReplacements[ch];

function escapeHtmlEntities(html, encode) {
  if (encode) {
    if (other.escapeTest.test(html)) {
      return html.replace(other.escapeReplace, getEscapeReplacement);
    }
  } else {
    if (other.escapeTestNoEncode.test(html)) {
      return html.replace(other.escapeReplaceNoEncode, getEscapeReplacement);
    }
  }
  return html;
}

function decodeNumericCharacterReferences(text) {
  if (!other.numericCharacterReference.test(text)) {
    return text;
  }
  return text.replace(other.numericCharacterReferenceOrAmpersand, (ref, dec, hex) => {
    if (dec === undefined && hex === undefined) {
      return '&amp;';
    }
    const code = dec === undefined ? Number.parseInt(hex, 16) : Number.parseInt(dec, 10);
    if (code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
      return '�';
    }
    return code === 38 ? '&amp;' : String.fromCodePoint(code);
  });
}

function cleanUrl(href) {
  try {
    href = encodeURI(href).replace(other.percentDecode, '%');
  } catch {
    return null;
  }
  return href;
}

function splitCells(tableRow, count) {
  const row = tableRow.replace(other.findPipe, (match, offset, str) => {
    let escaped = false;
    let curr = offset;
    while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;
    if (escaped) {
      return '|';
    } else {
      return ' |';
    }
  });
  const cells = row.split(other.splitPipe);
  let i = 0;
  if (!cells[0].trim()) {
    cells.shift();
  }
  if (cells.length > 0 && !cells.at(-1)?.trim()) {
    cells.pop();
  }
  if (count) {
    if (cells.length > count) {
      cells.splice(count);
    } else {
      while (cells.length < count) cells.push('');
    }
  }
  for (; i < cells.length; i++) {
    cells[i] = cells[i].trim().replace(other.slashPipe, '|');
  }
  return cells;
}

function rtrim(str, c, invert) {
  const l = str.length;
  if (l === 0) {
    return '';
  }
  let suffLen = 0;
  while (suffLen < l) {
    const currChar = str.charAt(l - suffLen - 1);
    if (currChar === c && !invert) {
      suffLen++;
    } else if (currChar !== c && invert) {
      suffLen++;
    } else {
      break;
    }
  }
  return str.slice(0, l - suffLen);
}

function trimTrailingBlankLines(str) {
  const lines = str.split('\n');
  let end = lines.length - 1;
  while (end >= 0 && other.blankLine.test(lines[end])) {
    end--;
  }
  if (lines.length - end <= 2) {
    return str;
  }
  return lines.slice(0, end + 1).join('\n');
}

function normalizeLabel(label) {
  return label.trim().replace(other.multipleSpaceGlobal, ' ').toLowerCase().toUpperCase().toLowerCase();
}

function findClosingBracket(str, b) {
  if (str.indexOf(b[0]) === -1 && str.indexOf(b[1]) === -1) {
    return -1;
  }
  let level = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      i++;
    } else if (str[i] === b[0]) {
      level++;
    } else if (str[i] === b[1]) {
      level--;
      if (level < 0) {
        return i;
      }
    }
  }
  if (level > 0) {
    return -2;
  }
  return -1;
}

function scanLastPossibleEmStrongDelClosers(src) {
  const last = { '*': -1, '_': -1 };
  let lastDel = -1;
  const len = src.length;
  for (let i = 0; i < len; i++) {
    const ch = src[i];
    if (ch !== '*' && ch !== '_' && ch !== '~') {
      continue;
    }
    const prev = i === 0 ? '\n' : src[i - 1];
    let j = i + 1;
    while (j < len && src[j] === ch) {
      j++;
    }
    if (prev !== ' ' && prev !== '\t' && prev !== '\n' && prev !== '\r' && prev !== '\f') {
      if (ch === '~') {
        lastDel = i;
      } else {
        last[ch] = i;
      }
    }
    i = j - 1;
  }
  return { maskedSrc: src, last, lastDel };
}

function expandTabs(line, indent = 0) {
  let col = indent;
  let expanded = '';
  for (const char of line) {
    if (char === '\t') {
      const added = 4 - (col % 4);
      expanded += ' '.repeat(added);
      col += added;
    } else {
      expanded += char;
      col++;
    }
  }
  return expanded;
}

// ---- Tokenizer ----
function outputLink(cap, link, raw, lexer) {
  const href = link.href;
  const title = link.title || null;
  const text = cap[1].replace(other.outputLinkReplace, '$1');
  const isImage = cap[0].charAt(0) === '!';

  const outerInLink = lexer.state.inLink;
  const outerLinkEmitted = lexer.state.linkEmitted;
  const outerInRawBlock = lexer.state.inRawBlock;
  lexer.state.inLink = true;
  lexer.state.linkEmitted = false;
  const tokens = lexer.inlineTokens(text);
  const textHasLink = lexer.state.linkEmitted;
  lexer.state.linkEmitted = outerLinkEmitted;
  lexer.state.inLink = outerInLink;

  if (!isImage) {
    if (textHasLink) {
      lexer.state.inRawBlock = outerInRawBlock;
      return;
    }
    lexer.state.linkEmitted = true;
  }

  return {
    type: isImage ? 'image' : 'link',
    raw,
    href,
    title,
    text,
    tokens,
  };
}

function indentCodeCompensation(raw, text) {
  const matchIndentToCode = raw.match(other.indentCodeCompensation);
  if (matchIndentToCode === null) {
    return text;
  }
  const indentToCode = matchIndentToCode[1];
  return text
    .split('\n')
    .map(node => {
      const matchIndentInNode = node.match(other.beginningSpace);
      if (matchIndentInNode === null) {
        return node;
      }
      const [indentInNode] = matchIndentInNode;
      return node.slice(Math.min(indentInNode.length, indentToCode.length));
    })
    .join('\n');
}

function isLabelEndInsideToken(src, pos, label, labelStart) {
  if (!label.includes('<')) {
    return false;
  }
  for (let i = 0; i < label.length; i++) {
    if (label[i] === '\\') {
      i++;
      continue;
    }
    if (label[i] === '`') {
      const code = inline.code.exec(label.slice(i));
      if (code) {
        i += code[0].length - 1;
        continue;
      }
    }
    if (label[i] !== '<') {
      continue;
    }
    const tokenSrc = src.slice(pos + labelStart + i);
    const token = inline.tag.exec(tokenSrc) || inline.autolink.exec(tokenSrc);
    if (!token) {
      continue;
    }
    if (token[0].length > label.length - i) {
      return true;
    }
    i += token[0].length - 1;
  }
  return false;
}

class Tokenizer {
  constructor() {
    this.lexer = null;
  }

  space(src, pos) {
    const cap = ex(blockY.newline, src, pos);
    if (cap && cap[0].length > 0) {
      return { type: 'space', raw: cap[0] };
    }
  }

  code(src, pos) {
    const cap = ex(blockY.code, src, pos);
    if (cap) {
      const raw = trimTrailingBlankLines(cap[0]);
      const text = raw.replace(other.codeRemoveIndent, '');
      return { type: 'code', raw, codeBlockStyle: 'indented', text };
    }
  }

  fences(src, pos) {
    const cap = ex(blockY.fences, src, pos);
    if (cap) {
      const raw = cap[0];
      const text = indentCodeCompensation(raw, cap[3] || '');
      return {
        type: 'code',
        raw,
        lang: cap[2] ? cap[2].trim().replace(inline.anyPunctuation, '$1') : cap[2],
        text,
      };
    }
  }

  heading(src, pos) {
    const cap = ex(blockY.heading, src, pos);
    if (cap) {
      let text = cap[2].trim();
      if (other.endingHash.test(text)) {
        const trimmed = rtrim(text, '#');
        if (!trimmed || other.endingSpaceTabChar.test(trimmed)) {
          text = trimmed.trim();
        }
      }
      return {
        type: 'heading',
        raw: rtrim(cap[0], '\n'),
        depth: cap[1].length,
        text,
        tokens: this.lexer.inline(text),
      };
    }
  }

  hr(src, pos) {
    const cap = ex(blockY.hr, src, pos);
    if (cap) {
      return { type: 'hr', raw: rtrim(cap[0], '\n') };
    }
  }

  blockquote(src, pos) {
    const cap = ex(blockY.blockquote, src, pos);
    if (cap) {
      let lines = rtrim(cap[0], '\n').split('\n');
      let raw = '';
      let text = '';
      const tokens = [];

      while (lines.length > 0) {
        let inBlockquote = false;
        const currentLines = [];
        let i;
        for (i = 0; i < lines.length; i++) {
          if (other.blockquoteStart.test(lines[i])) {
            currentLines.push(lines[i]);
            inBlockquote = true;
          } else if (!inBlockquote) {
            currentLines.push(lines[i]);
          } else {
            break;
          }
        }
        lines = lines.slice(i);

        const currentRaw = currentLines.join('\n');
        const currentText = currentRaw
          .replace(
            other.blockquoteMarkerWhitespace,
            (_, marker, whitespace) => marker + expandTabs(whitespace, marker.length),
          )
          .replace(other.blockquoteSetextReplace, '\n    $1')
          .replace(other.blockquoteSetextReplace2, '');
        raw = raw ? `${raw}\n${currentRaw}` : currentRaw;
        text = text ? `${text}\n${currentText}` : currentText;

        const top = this.lexer.state.top;
        this.lexer.state.top = true;
        this.lexer.blockTokens(currentText, tokens, true);
        this.lexer.state.top = top;

        if (lines.length === 0) {
          break;
        }

        const lastToken = tokens.at(-1);

        if (lastToken?.type === 'code' || lastToken?.type === 'heading' || lastToken?.type === 'hr' || lastToken?.type === 'html' || lastToken?.type === 'table') {
          break;
        } else if (lastToken?.type === 'blockquote') {
          const oldToken = lastToken;
          const continuation = lines.join('\n');
          const newText = oldToken.raw + '\n' + continuation.replace(other.blockquoteSetextReplace2, '');
          const newToken = this.blockquote(newText, 0);
          tokens[tokens.length - 1] = newToken;
          const leftover = newText.substring(newToken.raw.length).replace(/^\n/, '');
          const leftoverCount = leftover ? leftover.split('\n').length : 0;
          const consumed = leftoverCount ? lines.slice(0, -leftoverCount) : lines;
          if (consumed.length > 0) {
            raw = `${raw}\n${consumed.join('\n')}`;
          }
          text = text.substring(0, text.length - oldToken.text.length) + newToken.text;
          lines = lines.slice(consumed.length);
          if (lines.length > 0 && other.blockquoteStart.test(lines[0])) {
            continue;
          }
          break;
        } else if (lastToken?.type === 'list') {
          const oldToken = lastToken;
          const newText = oldToken.raw + '\n' + lines.join('\n');
          const newToken = this.list(newText, 0);
          tokens[tokens.length - 1] = newToken;
          const consumedCount = newToken.raw.length > oldToken.raw.length
            ? newText.slice(oldToken.raw.length + 1, newToken.raw.length).split('\n').length
            : 0;
          if (consumedCount > 0) {
            const consumed = lines.slice(0, consumedCount).join('\n');
            raw = `${raw}\n${consumed}`;
            text = `${text}\n${consumed}`;
          }
          lines = lines.slice(consumedCount);
          continue;
        }
      }

      return { type: 'blockquote', raw, tokens, text };
    }
  }

  list(src, pos) {
    let cap = ex(blockY.list, src, pos);
    if (cap) {
      const listSrc = src;
      const startPos = pos;
      let p = pos;
      const taken = () => p - startPos;
      let bull = cap[1].trim();
      const isordered = bull.length > 1;

      const list = {
        type: 'list',
        raw: '',
        ordered: isordered,
        start: isordered ? +bull.slice(0, -1) : '',
        loose: false,
        items: [],
      };

      bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;

      const itemRegex = listItemRegexSticky(bull);
      let endsWithBlankLine = false;
      while (p < src.length) {
        let endEarly = false;
        let itemContents = '';
        if (!(cap = ex(itemRegex, src, p))) {
          break;
        }
        if (ex(blockY.hr, src, p)) {
          break;
        }

        const itemStart = taken();
        p += cap[0].length;

        const firstLine = cap[2].split('\n', 1)[0];
        const bulletIndent = cap[1].length;
        const line0 = firstLine.replace(other.leadingSpaceTab, whitespace => expandTabs(whitespace, bulletIndent));
        let nextLine;
        {
          const nl = src.indexOf('\n', p);
          nextLine = nl === -1 ? src.slice(p) : src.slice(p, nl);
        }
        let blankLine = !line0.trim();
        let line = line0;

        let indent = 0;
        if (blankLine) {
          indent = bulletIndent + 1;
        } else {
          indent = line.search(other.nonSpaceChar);
          indent = indent > 4 ? 1 : indent;
          itemContents = line.slice(indent);
          indent += bulletIndent;
        }

        if (blankLine && other.blankLine.test(nextLine)) {
          p += nextLine.length + 1;
          endEarly = true;
        }

        if (!endEarly) {
          const nextBulletRegex = other.nextBulletRegex(indent);
          const hrRegex = other.hrRegex(indent);
          const fencesBeginRegex = other.fencesBeginRegex(indent);
          const headingBeginRegex = other.headingBeginRegex(indent);
          const htmlBeginRegex = other.htmlBeginRegex(indent);
          const blockquoteBeginRegex = other.blockquoteBeginRegex(indent);

          while (p < src.length) {
            const nlIdx = src.indexOf('\n', p);
            const rawLine = nlIdx === -1 ? src.slice(p) : src.slice(p, nlIdx);
            nextLine = rawLine;
            // Leading-whitespace expansion (tabs to tab stops) and the first
            // content character, in one scan.
            let col = 0, k = 0, sawTab = false;
            while (k < rawLine.length) {
              const ch = rawLine[k];
              if (ch === ' ') { col++; k++; }
              else if (ch === '\t') { sawTab = true; col += 4 - (col % 4); k++; }
              else break;
            }
            const firstCh = k < rawLine.length ? rawLine[k] : '';
            const nextLineWithoutTabs = k === 0 ? rawLine : ' '.repeat(col) + rawLine.slice(k);
            const firstNonSpace = k >= rawLine.length ? -1 : col;

            // Begin-a-block dispatch: the six begin regexes can only match
            // when the line starts (after at most 3 spaces, no tab) with one
            // of a few characters, so a plain continuation line skips them.
            if (!sawTab && col <= 3 && firstCh) {
              if (firstCh === '`' || firstCh === '~') {
                if (fencesBeginRegex.test(nextLine)) break;
              } else if (firstCh === '#') {
                if (headingBeginRegex.test(nextLine)) break;
              } else if (firstCh === '<') {
                if (htmlBeginRegex.test(nextLine)) break;
              } else if (firstCh === '>') {
                if (blockquoteBeginRegex.test(nextLine)) break;
              } else if (firstCh === '*' || firstCh === '+' || firstCh === '-') {
                if (nextBulletRegex.test(nextLine)) break;
                if (hrRegex.test(nextLine)) break;
              } else if (firstCh >= '0' && firstCh <= '9') {
                if (nextBulletRegex.test(nextLine)) break;
              } else if (firstCh === '_') {
                if (hrRegex.test(nextLine)) break;
              }
            }

            if (firstNonSpace >= indent || !nextLine.trim()) {
              itemContents += '\n' + nextLineWithoutTabs.slice(indent);
            } else {
              if (blankLine) {
                break;
              }
              if (line.replace(other.tabCharGlobal, '    ').search(other.nonSpaceChar) >= 4) {
                break;
              }
              if (fencesBeginRegex.test(line)) {
                break;
              }
              if (headingBeginRegex.test(line)) {
                break;
              }
              if (htmlBeginRegex.test(line)) {
                break;
              }
              if (hrRegex.test(line)) {
                break;
              }
              const setextContinuation = /^ {0,3}(?:=+|-+) *$/.test(nextLine)
                && block.lheading.test(`${line}\n${nextLine}`);
              const continuation = setextContinuation
                ? `    ${nextLineWithoutTabs.replace(/^ {0,3}/, '')}`
                : nextLine;
              itemContents += '\n' + continuation;
            }

            blankLine = !nextLine.trim();
            p += rawLine.length + 1;
            line = nextLineWithoutTabs.slice(indent);
          }
        }

        const raw = listSrc.slice(startPos + itemStart, p);

        if (!list.loose) {
          if (endsWithBlankLine) {
            list.loose = true;
          } else if (other.doubleBlankLine.test(raw)) {
            endsWithBlankLine = true;
          }
        }

        list.items.push({
          type: 'list_item',
          raw,
          task: !!other.listIsTask.test(itemContents),
          loose: false,
          text: itemContents,
          tokens: [],
        });
      }

      const lastItem = list.items.at(-1);
      if (lastItem) {
        lastItem.raw = lastItem.raw.trimEnd();
        lastItem.text = lastItem.text.trimEnd();
      } else {
        return;
      }
      list.raw = listSrc.slice(startPos, p).trimEnd();

      for (const item of list.items) {
        this.lexer.state.top = false;
        item.tokens = this.lexer.blockTokens(item.text, []);

        if (!list.loose) {
          const spacers = item.tokens.filter(t => t.type === 'space');
          const hasMultipleLineBreaks = spacers.length > 0 && spacers.some(t => other.anyLine.test(t.raw));
          list.loose = hasMultipleLineBreaks;
        }
      }

      for (const item of list.items) {
        const itemToken = item.tokens[0];
        if (item.task && (itemToken?.type === 'text' || itemToken?.type === 'paragraph')) {
          item.text = item.text.replace(other.listReplaceTask, '');
          itemToken.raw = itemToken.raw.replace(other.listReplaceTask, '');
          itemToken.text = itemToken.text.replace(other.listReplaceTask, '');
          for (let i = this.lexer.inlineQueue.length - 1; i >= 0; i--) {
            if (other.listIsTask.test(this.lexer.inlineQueue[i].src)) {
              this.lexer.inlineQueue[i].src = this.lexer.inlineQueue[i].src.replace(other.listReplaceTask, '');
              break;
            }
          }

          const taskRaw = other.listTaskCheckbox.exec(item.raw);
          if (taskRaw) {
            const checkboxToken = {
              type: 'checkbox',
              raw: taskRaw[0] + ' ',
              checked: taskRaw[0] !== '[ ]',
            };
            item.checked = checkboxToken.checked;
            if (list.loose) {
              if (item.tokens[0] && ['paragraph', 'text'].includes(item.tokens[0].type) && 'tokens' in item.tokens[0] && item.tokens[0].tokens) {
                item.tokens[0].raw = checkboxToken.raw + item.tokens[0].raw;
                item.tokens[0].text = checkboxToken.raw + item.tokens[0].text;
                item.tokens[0].tokens.unshift(checkboxToken);
              } else {
                item.tokens.unshift({
                  type: 'paragraph',
                  raw: checkboxToken.raw,
                  text: checkboxToken.raw,
                  tokens: [checkboxToken],
                });
              }
            } else {
              item.tokens.unshift(checkboxToken);
            }
          }
        } else if (item.task) {
          item.task = false;
        }
      }

      if (list.loose) {
        for (const item of list.items) {
          item.loose = true;
          for (const token of item.tokens) {
            if (token.type === 'text') {
              token.type = 'paragraph';
            }
          }
        }
      }

      return list;
    }
  }

  html(src, pos) {
    const cap = ex(blockY.html, src, pos);
    if (cap) {
      const raw = trimTrailingBlankLines(cap[0]);
      return {
        type: 'html',
        block: true,
        raw,
        pre: cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style',
        text: raw,
      };
    }
  }

  def(src, pos) {
    const cap = ex(blockY.def, src, pos);
    if (cap) {
      if (!other.startAngleBracket.test(cap[2]) && findClosingBracket(cap[2], '()') !== -1) {
        return;
      }
      const tag = normalizeLabel(cap[1]);
      const href = cap[2] ? cap[2].replace(other.hrefBrackets, '$1').replace(inline.anyPunctuation, '$1') : '';
      const title = cap[3] ? cap[3].substring(1, cap[3].length - 1).replace(inline.anyPunctuation, '$1') : cap[3];
      return { type: 'def', tag, raw: rtrim(cap[0], '\n'), href, title };
    }
  }

  table(src, pos) {
    const cap = ex(blockY.table, src, pos);
    if (!cap) {
      return;
    }
    if (!other.tableDelimiter.test(cap[2])) {
      return;
    }
    const headers = splitCells(cap[1]);
    const aligns = cap[2].replace(other.tableAlignChars, '').split('|');
    const rows = cap[3]?.trim() ? cap[3].replace(other.tableRowBlankLine, '').split('\n') : [];

    const item = {
      type: 'table',
      raw: rtrim(cap[0], '\n'),
      header: [],
      align: [],
      rows: [],
    };

    if (headers.length !== aligns.length) {
      return;
    }

    for (const align of aligns) {
      if (other.tableAlignRight.test(align)) {
        item.align.push('right');
      } else if (other.tableAlignCenter.test(align)) {
        item.align.push('center');
      } else if (other.tableAlignLeft.test(align)) {
        item.align.push('left');
      } else {
        item.align.push(null);
      }
    }

    for (let i = 0; i < headers.length; i++) {
      item.header.push({
        text: headers[i],
        tokens: this.lexer.inline(headers[i]),
        header: true,
        align: item.align[i],
      });
    }

    for (const row of rows) {
      item.rows.push(splitCells(row, item.header.length).map((cell, i) => {
        return {
          text: cell,
          tokens: this.lexer.inline(cell),
          header: false,
          align: item.align[i],
        };
      }));
    }

    return item;
  }

  lheading(src, pos) {
    const cap = ex(blockY.lheading, src, pos);
    if (cap) {
      const text = cap[1].trim();
      return {
        type: 'heading',
        raw: rtrim(cap[0], '\n'),
        depth: cap[2].charAt(0) === '=' ? 1 : 2,
        text,
        tokens: this.lexer.inline(text),
      };
    }
  }

  paragraph(src, pos) {
    const cap = ex(blockY.paragraph, src, pos);
    if (cap) {
      const text = cap[1].charAt(cap[1].length - 1) === '\n'
        ? cap[1].slice(0, -1)
        : cap[1];
      return {
        type: 'paragraph',
        raw: cap[0],
        text,
        tokens: this.lexer.inline(text),
      };
    }
  }

  text(src, pos) {
    const cap = ex(blockY.text, src, pos);
    if (cap) {
      return {
        type: 'text',
        raw: cap[0],
        text: cap[0],
        tokens: this.lexer.inline(cap[0]),
      };
    }
  }

  escape(src, pos) {
    const cap = ex(inlineY.escape, src, pos);
    if (cap) {
      return { type: 'escape', raw: cap[0], text: cap[1] };
    }
  }

  tag(src, pos) {
    const cap = ex(inlineY.tag, src, pos);
    if (cap) {
      if (!this.lexer.state.inLink && other.startATag.test(cap[0])) {
        this.lexer.state.inLink = true;
      } else if (this.lexer.state.inLink && other.endATag.test(cap[0])) {
        this.lexer.state.inLink = false;
      }
      if (!this.lexer.state.inRawBlock && other.startPreScriptTag.test(cap[0])) {
        this.lexer.state.inRawBlock = true;
      } else if (this.lexer.state.inRawBlock && other.endPreScriptTag.test(cap[0])) {
        this.lexer.state.inRawBlock = false;
      }
      return {
        type: 'html',
        raw: cap[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        block: false,
        text: cap[0],
      };
    }
  }

  link(src, pos) {
    if (this.lexer.state.linkParenPossible === false) {
      return undefined;
    }
    const cap = ex(inlineY.link, src, pos);
    if (cap) {
      const labelStart = cap[0].charAt(0) === '!' ? 2 : 1;
      if (isLabelEndInsideToken(src, pos, cap[1], labelStart)) {
        return;
      }
      const trimmedUrl = cap[2].trim();
      if (other.startAngleBracket.test(trimmedUrl)) {
        if (!(other.endAngleBracket.test(trimmedUrl))) {
          return;
        }
        const rtrimSlash = rtrim(trimmedUrl.slice(0, -1), '\\');
        if ((trimmedUrl.length - rtrimSlash.length) % 2 === 0) {
          return;
        }
      } else {
        const lastParenIndex = findClosingBracket(cap[2], '()');
        if (lastParenIndex === -2) {
          return;
        }
        if (lastParenIndex > -1) {
          const start = cap[0].indexOf('!') === 0 ? 5 : 4;
          const linkLen = start + cap[1].length + lastParenIndex;
          cap[2] = cap[2].substring(0, lastParenIndex);
          cap[0] = cap[0].substring(0, linkLen).trim();
          cap[3] = '';
        }
      }
      const unescaped = rtrim(cap[0].slice(0, -1), '\\');
      if ((cap[0].length - unescaped.length) % 2 === 0) {
        return;
      }
      let href = cap[2];
      let title = '';
      title = cap[3] ? cap[3].slice(1, -1) : '';
      href = href.trim();
      if (other.startAngleBracket.test(href)) {
        href = href.slice(1, -1);
      }
      return outputLink(cap, {
        href: href ? href.replace(inline.anyPunctuation, '$1') : href,
        title: title ? title.replace(inline.anyPunctuation, '$1') : title,
      }, cap[0], this.lexer);
    }
  }

  reflink(src, pos, links) {
    let cap;
    if ((cap = ex(inlineY.reflink, src, pos))
      || (cap = ex(inlineY.nolink, src, pos))) {
      const labelStart = cap[0].charAt(0) === '!' ? 2 : 1;
      if (isLabelEndInsideToken(src, pos, cap[1], labelStart)) {
        return;
      }
      const link = links[normalizeLabel(cap[2] || cap[1])];
      if (!link) {
        const text = cap[0].charAt(0);
        return { type: 'text', raw: text, text };
      }
      return outputLink(cap, link, cap[0], this.lexer);
    }
  }

  emStrong(src, pos, maskedSrc, prevChar = '') {
    let match = ex(inlineY.emStrongLDelim, src, pos);
    if (!match) return;
    if (!match[1] && !match[2] && !match[3] && !match[4]) return;

    const delimChar = match[0][0];
    const midRun = prevChar === delimChar;
    const srcStart = pos;
    let runStart = srcStart;
    while (runStart > 0 && maskedSrc[runStart - 1] === delimChar) {
      runStart--;
    }
    const runPrevChar = [...maskedSrc.slice(Math.max(0, runStart - 2), runStart)].at(-1) ?? '';
    const runPrevPunct = runPrevChar === '*' || runPrevChar === '_' || !!inline.punctuation.exec(runPrevChar);
    if (runStart < srcStart) {
      prevChar = runPrevChar;
    }
    const prevPunct = runStart < srcStart ? runPrevPunct : !!inline.punctuation.exec(prevChar);

    if (match[4] && prevChar.match(other.unicodeAlphaNumeric)) return;

    const nextChar = match[1] || match[3] || '';

    if (!nextChar || !prevChar || prevPunct) {
      const lLength = [...match[0]].length - 1;
      let rDelim, rLength, delimTotal = lLength, midDelimTotal = 0;
      const runLength = srcStart - runStart + lLength;
      const openerCanClose = !!runPrevChar.trim()
        && (!!nextChar || (delimChar === '*' && !runPrevPunct));
      if (delimChar !== '*' && delimChar !== '_') return;
      const endReg = delimChar === '*' ? inline.emStrongRDelimAst : inline.emStrongRDelimUnd;
      const lastPossibleEmStrongCloserIndex = this.lexer.cachedLastPossibleEmStrongCloserIndex(maskedSrc, delimChar);
      const emStrongCloserWindowStart = pos + lLength;
      if (lastPossibleEmStrongCloserIndex < emStrongCloserWindowStart) return;
      const clipped = maskedSrc.slice(emStrongCloserWindowStart);
      const lastPossibleEmStrongCloserIndexInWindow = lastPossibleEmStrongCloserIndex - emStrongCloserWindowStart;
      endReg.lastIndex = 0;

      while ((match = endReg.exec(clipped)) !== null) {
        if (match.index > lastPossibleEmStrongCloserIndexInWindow) break;
        rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
        if (!rDelim) continue;
        rLength = [...rDelim].length;

        if (match[3] || match[4]) {
          delimTotal += rLength;
          continue;
        } else if (match[5] || match[6] || openerCanClose) {
          if (midRun && (match[5] || match[6])) {
            break;
          }
          if (runLength % 3 && !((runLength + rLength) % 3)) {
            midDelimTotal += rLength;
            continue;
          }
        }

        delimTotal -= rLength;
        if (delimTotal > 0) continue;

        rLength = Math.min(rLength, rLength + delimTotal + midDelimTotal);
        const lastCharLength = [...match[0]][0].length;
        const raw = src.slice(pos, pos + lLength + match.index + lastCharLength + rLength);

        if (Math.min(lLength, rLength) % 2) {
          const text = raw.slice(1, -1);
          return {
            type: 'em',
            raw,
            text,
            tokens: this.lexer.inlineTokens(text),
          };
        }
        const text = raw.slice(2, -2);
        return {
          type: 'strong',
          raw,
          text,
          tokens: this.lexer.inlineTokens(text),
        };
      }
    }
  }

  codespan(src, pos) {
    const cap = ex(inlineY.code, src, pos);
    if (cap) {
      let text = cap[2].replace(other.newLineCharGlobal, ' ');
      const hasNonSpaceChars = other.nonSpaceChar.test(text);
      const hasSpaceCharsOnBothEnds = other.startingSpaceChar.test(text) && other.endingSpaceChar.test(text);
      if (hasNonSpaceChars && hasSpaceCharsOnBothEnds) {
        text = text.substring(1, text.length - 1);
      }
      return { type: 'codespan', raw: cap[0], text };
    }
  }

  br(src, pos) {
    const cap = ex(inlineY.br, src, pos);
    if (cap) {
      return { type: 'br', raw: cap[0] };
    }
  }

  del(src, pos, maskedSrc, prevChar = '') {
    let match = ex(inlineY.delLDelim, src, pos);
    if (!match) return;

    const nextChar = match[1] || '';

    if (!nextChar || !prevChar || inline.punctuation.exec(prevChar)) {
      const lLength = [...match[0]].length - 1;
      let rDelim, rLength, delimTotal = lLength;
      const endReg = inline.delRDelim;
      const lastPossibleDelCloserIndex = this.lexer.cachedLastPossibleDelCloserIndex(maskedSrc);
      const delCloserWindowStart = pos + lLength;
      if (lastPossibleDelCloserIndex < delCloserWindowStart) return;
      const clipped = maskedSrc.slice(delCloserWindowStart);
      const lastPossibleDelCloserIndexInWindow = lastPossibleDelCloserIndex - delCloserWindowStart;
      endReg.lastIndex = 0;

      while ((match = endReg.exec(clipped)) !== null) {
        if (match.index > lastPossibleDelCloserIndexInWindow) break;
        rDelim = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
        if (!rDelim) continue;
        rLength = [...rDelim].length;
        if (rLength !== lLength) continue;
        if (match[3] || match[4]) {
          delimTotal += rLength;
          continue;
        }
        delimTotal -= rLength;
        if (delimTotal > 0) continue;
        rLength = Math.min(rLength, rLength + delimTotal);
        const lastCharLength = [...match[0]][0].length;
        const raw = src.slice(pos, pos + lLength + match.index + lastCharLength + rLength);
        const text = raw.slice(lLength, -lLength);
        return {
          type: 'del',
          raw,
          text,
          tokens: this.lexer.inlineTokens(text),
        };
      }
    }
  }

  autolink(src, pos) {
    const cap = ex(inlineY.autolink, src, pos);
    if (cap) {
      let text, href;
      if (cap[2] === '@') {
        text = cap[1];
        href = 'mailto:' + text;
      } else {
        text = cap[1];
        href = text;
      }
      return {
        type: 'link',
        raw: cap[0],
        text,
        href,
        autolink: true,
        tokens: [{ type: 'text', raw: text, text }],
      };
    }
  }

  url(src, pos) {
    let cap;
    if (cap = ex(inlineY.url, src, pos)) {
      let text, href;
      if (cap[2] === '@') {
        text = cap[0];
        href = 'mailto:' + text;
      } else {
        let prevCapZero;
        do {
          prevCapZero = cap[0];
          cap[0] = inline._backpedal.exec(cap[0])?.[0] ?? '';
        } while (prevCapZero !== cap[0]);
        text = cap[0];
        if (cap[1] === 'www.') {
          href = 'http://' + cap[0];
        } else {
          href = cap[0];
        }
      }
      return {
        type: 'link',
        raw: cap[0],
        text,
        href,
        autolink: true,
        tokens: [{ type: 'text', raw: text, text }],
      };
    }
  }

  inlineText(src, pos, inRawBlock) {
    const cap = ex(inlineY.text, src, pos);
    if (cap) {
      const escaped = inRawBlock;
      return {
        type: 'text',
        raw: cap[0],
        text: escaped ? cap[0] : decodeNumericCharacterReferences(cap[0]),
        escaped,
      };
    }
  }
}

// ---- Fast plain-text scan ----
// Characters that can start an inline token (the text regex stops before them).
const TEXT_STOP = new Uint8Array(128);
for (const c of [92, 60, 91, 33, 96, 42, 126, 95]) TEXT_STOP[c] = 1; // \ < [ ! ` * ~ _
// Characters in an extended-autolink local part (the text regex's email class).
const EMAIL_LOCAL = new Uint8Array(128);
for (let c = 48; c <= 57; c++) EMAIL_LOCAL[c] = 1;
for (let c = 65; c <= 90; c++) EMAIL_LOCAL[c] = 1;
for (let c = 97; c <= 122; c++) EMAIL_LOCAL[c] = 1;
for (const c of [46, 33, 35, 36, 37, 38, 39, 42, 43, 47, 61, 63, 95, 96, 123, 124, 125, 126, 45]) EMAIL_LOCAL[c] = 1;

function isAlnumCode(code) {
  return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

// Does an email-local run starting at `from` end with '@'? Returns the index
// just past the run, or -1 when the run is empty or not followed by '@'.
function emailRunEnd(src, from, end) {
  let j = from;
  while (j < end) {
    const code = src.charCodeAt(j);
    if (code >= 128 || !EMAIL_LOCAL[code]) break;
    j++;
  }
  if (j === from || j >= end || src.charCodeAt(j) !== 64) return -1; // 64 = @
  return j;
}

function startsWithProtocol(src, p, end) {
  const c = src.charCodeAt(p) | 32;
  if (c === 104) { // h
    if (p + 7 <= end
      && (src.charCodeAt(p + 1) | 32) === 116
      && (src.charCodeAt(p + 2) | 32) === 116
      && (src.charCodeAt(p + 3) | 32) === 112
      && src.charCodeAt(p + 4) === 58
      && src.charCodeAt(p + 5) === 47
      && src.charCodeAt(p + 6) === 47) return true;
    if (p + 8 <= end
      && (src.charCodeAt(p + 1) | 32) === 116
      && (src.charCodeAt(p + 2) | 32) === 116
      && (src.charCodeAt(p + 3) | 32) === 112
      && (src.charCodeAt(p + 4) | 32) === 115
      && src.charCodeAt(p + 5) === 58
      && src.charCodeAt(p + 6) === 47
      && src.charCodeAt(p + 7) === 47) return true;
  } else if (c === 102) { // f
    if (p + 6 <= end
      && (src.charCodeAt(p + 1) | 32) === 116
      && (src.charCodeAt(p + 2) | 32) === 112
      && src.charCodeAt(p + 3) === 58
      && src.charCodeAt(p + 4) === 47
      && src.charCodeAt(p + 5) === 47) return true;
  }
  return false;
}

function startsWithWww(src, p, end) {
  if (p + 4 > end) return false;
  if (src.charCodeAt(p) !== 119) return false;
  if (src.charCodeAt(p + 1) !== 119) return false;
  if (src.charCodeAt(p + 2) !== 119) return false;
  if (src.charCodeAt(p + 3) !== 46) return false;
  if (p === 0) return true;
  const prev = src.charCodeAt(p - 1);
  return prev === 32 || prev === 9 || prev === 10 || prev === 13 || prev === 12
    || prev === 42 || prev === 95 || prev === 126 || prev === 40; // space \t \n \r \f * _ ~ (
}

function startsWithMailto(src, p, end) {
  if (p + 7 <= end
    && src.charCodeAt(p) === 109 && src.charCodeAt(p + 1) === 97
    && src.charCodeAt(p + 2) === 105 && src.charCodeAt(p + 3) === 108
    && src.charCodeAt(p + 4) === 116 && src.charCodeAt(p + 5) === 111
    && src.charCodeAt(p + 6) === 58) return true;
  if (p + 5 <= end
    && src.charCodeAt(p) === 120 && src.charCodeAt(p + 1) === 109
    && src.charCodeAt(p + 2) === 112 && src.charCodeAt(p + 3) === 112
    && src.charCodeAt(p + 4) === 58) return true;
  return false;
}

// Two or more spaces followed by a newline: a hard break may start here.
function hardBreakAhead(src, p, end) {
  let q = p;
  while (q < end && src.charCodeAt(q) === 32) q++;
  return q - p >= 2 && q < end && src.charCodeAt(q) === 10;
}

// Length of the plain-text run starting at `pos` (mirrors the GFM text
// regex's match). Always >= 1 when pos < end. hasAt says whether '@' occurs
// anywhere in the inline source (email stops need one).
function scanPlainText(src, pos, end, hasAt) {
  // The text regex matches a lone non-alphanumeric char followed by
  // mailto:/xmpp: as a single character.
  if (pos + 1 < end) {
    const c0 = src.charCodeAt(pos);
    if (c0 < 128 && !isAlnumCode(c0) && startsWithMailto(src, pos + 1, end)) {
      return 1;
    }
  }
  let p = pos;
  // First character(s): a backtick or tilde run, or exactly one character.
  const c0 = src.charCodeAt(p);
  if (c0 === 96 || c0 === 126) { // ` ~
    while (p < end && src.charCodeAt(p) === c0) p++;
  } else {
    p++;
  }
  let prevEmailLocal = false;
  for (; p < end; p++) {
    const code = src.charCodeAt(p);
    if (code < 128) {
      if (TEXT_STOP[code]) return p - pos;
      // Two-or-more spaces + newline: a hard break starts here.
      if (code === 32) {
        let q = p;
        while (q < end && src.charCodeAt(q) === 32) q++;
        if (q - p >= 2 && q < end && src.charCodeAt(q) === 10) return p - pos;
        prevEmailLocal = false;
        continue;
      }
      // A non-space char followed by 2+ spaces + newline ends after it.
      if (code !== 32) {
        const n1 = src.charCodeAt(p + 1);
        if (n1 === 32) {
          let q = p + 1;
          while (q < end && src.charCodeAt(q) === 32) q++;
          if (q - (p + 1) >= 2 && q < end && src.charCodeAt(q) === 10) return p + 1 - pos;
        }
      }
      if (EMAIL_LOCAL[code]) {
        if (!prevEmailLocal && hasAt) {
          // An email-local run starts here: stop if it ends with '@'.
          if (emailRunEnd(src, p, end) !== -1) return p - pos;
        }
        prevEmailLocal = true;
        // Protocol / www. autolink starts (w and h are email-local too).
        if (code === 104 || code === 72 || code === 102 || code === 70) {
          if (startsWithProtocol(src, p, end)) return p - pos;
        } else if (code === 119 || code === 87) {
          if (startsWithWww(src, p, end)) return p - pos;
        }
        continue;
      }
      prevEmailLocal = false;
      // Protocol / www. autolink starts.
      if (code === 104 || code === 72 || code === 102 || code === 70) {
        if (startsWithProtocol(src, p, end)) return p - pos;
      } else if (code === 119 || code === 87) {
        if (startsWithWww(src, p, end)) return p - pos;
      }
      // A non-alphanumeric char followed by mailto:/xmpp: ends after it.
      // A non-email char followed by an email run + '@' ends after it.
      if (!isAlnumCode(code)) {
        if (startsWithMailto(src, p + 1, end)) return p + 1 - pos;
        if (hasAt && emailRunEnd(src, p + 1, end) !== -1) return p + 1 - pos;
      }
    } else {
      prevEmailLocal = false;
    }
  }
  return end - pos;
}

// ---- Block pre-filters (each guard is a superset of its regex's requirement) ----
function maybeHtml(src, p) {
  let k = p;
  while (k < p + 3 && src[k] === ' ') k++;
  return src[k] === '<';
}

function maybeTable(src, p) {
  const nl = src.indexOf('\n', p);
  if (nl === -1) return false;
  let h = p;
  while (h < nl && src[h] === ' ') h++;
  if (h >= nl) return false;
  let d = nl + 1;
  let sp = 0;
  while (sp < 3 && src[d] === ' ') { d++; sp++; }
  const c = src[d];
  if (c !== '|' && c !== ':' && c !== '-') return false;
  const nl2 = src.indexOf('\n', d);
  const end = nl2 === -1 ? src.length : nl2;
  for (let i = d; i < end; i++) {
    if (src[i] === '-') return true;
  }
  return false;
}

function isSetextUnderline(src, s, e) {
  let i = s;
  let sp = 0;
  while (sp < 3 && src[i] === ' ') { i++; sp++; }
  if (i >= e) return false;
  const ch = src[i];
  if (ch !== '=' && ch !== '-') return false;
  let j = i;
  while (j < e && src[j] === ch) j++;
  while (j < e && (src[j] === ' ' || src[j] === '\t')) j++;
  return j >= e;
}

function isBlankLine(src, s, e) {
  for (let i = s; i < e; i++) {
    if (src[i] !== ' ' && src[i] !== '\t') return false;
  }
  return true;
}

function isInterruptLine(src, s, e, hasNewline) {
  let i = s;
  let sp = 0;
  while (sp < 3 && src[i] === ' ') { i++; sp++; }
  if (i >= e) return false;
  const c = src[i];
  if (c === ' ' || c === '\t') return true; // indented code
  if (c === '>') return true;
  if (c === '#') {
    let j = i;
    while (j < e && src[j] === '#') j++;
    const n = j - i;
    if (n >= 1 && n <= 6 && (j >= e || src[j] === ' ' || src[j] === '\t')) return true;
    return false;
  }
  if (c === '`' || c === '~') {
    let j = i;
    while (j < e && src[j] === c) j++;
    return j - i >= 3;
  }
  if (c === '*' || c === '+' || c === '-') return true; // bullet
  if (c >= '0' && c <= '9') {
    let j = i;
    while (j < e && src[j] >= '0' && src[j] <= '9' && j - i < 9) j++;
    return j < e && (src[j] === '.' || src[j] === ')');
  }
  if (c === '<') { // whole line is one tag, followed by a newline
    if (!hasNewline) return false;
    const gt = src.indexOf('>', i);
    return gt !== -1 && gt === e - 1 && gt > i + 1;
  }
  if (c === '|' || c === ':') { // table delimiter row: only | : - space, has a |
    if (!hasNewline) return false;
    let hasPipe = false;
    for (let j = i; j < e; j++) {
      const ch = src[j];
      if (ch === '|') hasPipe = true;
      else if (ch !== ':' && ch !== '-' && ch !== ' ') return false;
    }
    return hasPipe;
  }
  if (c === '-' || c === '_' || c === '*') { // thematic break: 3+ of one marker
    let count = 0;
    for (let j = i; j < e; j++) {
      const ch = src[j];
      if (ch === c) count++;
      else if (ch !== ' ' && ch !== '\t') return false;
    }
    return count >= 3;
  }
  return false;
}

function maybeLheading(src, p) {
  let lineStart = src.indexOf('\n', p);
  if (lineStart === -1) return false;
  lineStart++;
  while (lineStart < src.length) {
    const nlIdx = src.indexOf('\n', lineStart);
    const hasNewline = nlIdx !== -1;
    const lineEnd = hasNewline ? nlIdx : src.length;
    if (isSetextUnderline(src, lineStart, lineEnd)) return true;
    if (isBlankLine(src, lineStart, lineEnd)) return false;
    if (isInterruptLine(src, lineStart, lineEnd, hasNewline)) return false;
    lineStart = lineEnd + 1;
  }
  return false;
}

// ---- Lexer ----
class Lexer {
  constructor() {
    this.tokens = [];
    this.tokens.links = Object.create(null);
    this.tokenizer = new Tokenizer();
    this.tokenizer.lexer = this;
    this.inlineQueue = [];
    this.state = {
      inLink: false,
      inRawBlock: false,
      linkEmitted: false,
      linkParenPossible: true,
      top: true,
    };
    this._closerFrames = [];
  }

  lex(src) {
    src = src.replace(other.carriageReturn, '\n');
    this.blockTokens(src, this.tokens);
    for (let i = 0; i < this.inlineQueue.length; i++) {
      const next = this.inlineQueue[i];
      this.state.inRawBlock = false;
      this.inlineTokens(next.src, next.tokens);
    }
    this.inlineQueue = [];
    return this.tokens;
  }

  blockTokens(src, tokens = [], lastParagraphClipped = false) {
    this.tokenizer.lexer = this;
    const len = src.length;
    let p = 0;
    let remaining = Infinity;
    while (p < len) {
      const r = len - p;
      if (r < remaining) {
        remaining = r;
      } else {
        throw new Error('Infinite loop on byte: ' + src.charCodeAt(p));
      }

      let token;
      // First-character dispatch: each block tokenizer's regex can only match
      // when the source starts with one of a few characters.
      const c = src.charCodeAt(p);
      const isSpace = c === 32 || c === 9;
      const isDigit = c >= 48 && c <= 57;

      if ((isSpace || c === 10) && (token = this.tokenizer.space(src, p))) {
        p += token.raw.length;
        const lastToken = tokens.at(-1);
        if (token.raw.length === 1 && lastToken !== undefined) {
          lastToken.raw += '\n';
        } else {
          tokens.push(token);
        }
        continue;
      }

      if (isSpace && (token = this.tokenizer.code(src, p))) {
        p += token.raw.length;
        const lastToken = tokens.at(-1);
        if (lastToken?.type === 'paragraph' || lastToken?.type === 'text') {
          lastToken.raw += (lastToken.raw.endsWith('\n') ? '' : '\n') + token.raw;
          lastToken.text += '\n' + token.text;
          this.inlineQueue.at(-1).src = lastToken.text;
        } else {
          tokens.push(token);
        }
        continue;
      }

      if ((isSpace || c === 96 || c === 126) && (token = this.tokenizer.fences(src, p))) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if ((isSpace || c === 35) && (token = this.tokenizer.heading(src, p))) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if ((isSpace || c === 45 || c === 95 || c === 42) && (token = this.tokenizer.hr(src, p))) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if ((isSpace || c === 62) && (token = this.tokenizer.blockquote(src, p))) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if ((isSpace || c === 42 || c === 43 || c === 45 || isDigit) && (token = this.tokenizer.list(src, p))) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if (maybeHtml(src, p) && (token = this.tokenizer.html(src, p))) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if ((isSpace || c === 91) && (token = this.tokenizer.def(src, p))) {
        p += token.raw.length;
        const lastToken = tokens.at(-1);
        if (lastToken?.type === 'paragraph' || lastToken?.type === 'text') {
          lastToken.raw += (lastToken.raw.endsWith('\n') ? '' : '\n') + token.raw;
          lastToken.text += '\n' + token.raw;
          this.inlineQueue.at(-1).src = lastToken.text;
        } else {
          if (!this.tokens.links[token.tag]) {
            this.tokens.links[token.tag] = { href: token.href, title: token.title };
          }
          tokens.push(token);
        }
        continue;
      }

      if (maybeTable(src, p) && (token = this.tokenizer.table(src, p))) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if (maybeLheading(src, p) && (token = this.tokenizer.lheading(src, p))) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if (this.state.top && (token = this.tokenizer.paragraph(src, p))) {
        const lastToken = tokens.at(-1);
        if (lastParagraphClipped && lastToken?.type === 'paragraph') {
          lastToken.raw += (lastToken.raw.endsWith('\n') ? '' : '\n') + token.raw;
          lastToken.text += '\n' + token.text;
          this.inlineQueue.pop();
          this.inlineQueue.at(-1).src = lastToken.text;
        } else {
          tokens.push(token);
        }
        lastParagraphClipped = false;
        p += token.raw.length;
        continue;
      }

      if (token = this.tokenizer.text(src, p)) {
        p += token.raw.length;
        const lastToken = tokens.at(-1);
        if (lastToken?.type === 'text') {
          lastToken.raw += (lastToken.raw.endsWith('\n') ? '' : '\n') + token.raw;
          lastToken.text += '\n' + token.text;
          this.inlineQueue.pop();
          this.inlineQueue.at(-1).src = lastToken.text;
        } else {
          tokens.push(token);
        }
        continue;
      }

      if (p < len) {
        throw new Error('Infinite loop on byte: ' + src.charCodeAt(p));
      }
    }

    this.state.top = true;
    return tokens;
  }

  inline(src, tokens = []) {
    this.inlineQueue.push({ src, tokens });
    return tokens;
  }

  linkInText(text) {
    if (!text.includes('[')) {
      return false;
    }
    for (const match of text.matchAll(inline.blockSkip)) {
      if (inline.link.test(match[0]) && text.charAt(match.index - 1) !== '!') {
        return true;
      }
    }
    for (const match of text.matchAll(inline.reflinkSearch)) {
      const match0 = match[0];
      const refStart = match0.lastIndexOf('[');
      if (match0.charAt(0) === '!' || !Object.hasOwn(this.tokens.links, normalizeLabel(match0.slice(refStart + 1, -1)))) {
        continue;
      }
      if (refStart > 1 && this.linkInText(match0.slice(1, refStart - 1))) {
        continue;
      }
      return true;
    }
    return false;
  }

  cachedLastPossibleEmStrongCloserIndex(maskedSrc, delim) {
    const frame = this._closerFrames.at(-1);
    if (frame && frame.maskedSrc === maskedSrc) {
      return frame.last[delim];
    }
    return scanLastPossibleEmStrongDelClosers(maskedSrc).last[delim];
  }

  cachedLastPossibleDelCloserIndex(maskedSrc) {
    const frame = this._closerFrames.at(-1);
    if (frame && frame.maskedSrc === maskedSrc) {
      return frame.lastDel;
    }
    return scanLastPossibleEmStrongDelClosers(maskedSrc).lastDel;
  }

  inlineTokens(src, tokens = []) {
    const prevLinkParenPossible = this.state.linkParenPossible;
    this.state.linkParenPossible = prevLinkParenPossible && src.includes(')');
    try {
      const maskedSrc = src.includes('*') || src.includes('_') || src.includes('~')
        ? this.maskSrc(src)
        : src;
      const needScan = maskedSrc.includes('*') || maskedSrc.includes('_') || maskedSrc.includes('~');
      this._closerFrames.push(needScan ? scanLastPossibleEmStrongDelClosers(maskedSrc) : { maskedSrc, last: { '*': -1, '_': -1 }, lastDel: -1 });
      try {
        return this.tokenizeInlines(src, maskedSrc, tokens);
      } finally {
        this._closerFrames.pop();
      }
    } finally {
      this.state.linkParenPossible = prevLinkParenPossible;
    }
  }

  tokenizeInlines(src, maskedSrc, tokens) {
    const len = src.length;
    const hasAt = src.includes('@');
    let p = 0;
    let keepPrevChar = false;
    let prevChar = '';
    let remaining = Infinity;
    while (p < len) {
      const r = len - p;
      if (r < remaining) {
        remaining = r;
      } else {
        throw new Error('Infinite loop on byte: ' + src.charCodeAt(p));
      }

      if (!keepPrevChar) {
        prevChar = '';
      }
      keepPrevChar = false;

      let token;

      // Fast path: a character that cannot start any other inline token goes
      // straight to the plain-text scan. Positions where url() could match
      // (www., protocol://, mailto:, bare email) and hard-break spaces stay
      // on the normal path.
      const ch0 = src.charCodeAt(p);
      if (ch0 !== 92 && ch0 !== 60 && ch0 !== 91 && ch0 !== 33 && ch0 !== 96
        && ch0 !== 42 && ch0 !== 95 && ch0 !== 126
        && !(ch0 === 32 && hardBreakAhead(src, p, len))
        && !(ch0 === 119 && p + 4 <= len && src.charCodeAt(p + 1) === 119
          && src.charCodeAt(p + 2) === 119 && src.charCodeAt(p + 3) === 46)
        && !startsWithProtocol(src, p, len)
        && !startsWithMailto(src, p, len)
        && !(hasAt && emailRunEnd(src, p, len) !== -1)) {
        const runLen = scanPlainText(src, p, len, hasAt);
        const raw = src.slice(p, p + runLen);
        const escaped = this.state.inRawBlock;
        token = {
          type: 'text',
          raw,
          text: escaped || !raw.includes('&') ? raw : decodeNumericCharacterReferences(raw),
          escaped,
        };
        p += runLen;
        if (token.raw.slice(-1) !== '_') {
          prevChar = token.raw.slice(-1);
        }
        keepPrevChar = true;
        const lastToken = tokens.at(-1);
        if (lastToken?.type === 'text') {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }

      if (token = this.tokenizer.escape(src, p)) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if (token = this.tokenizer.tag(src, p)) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if (token = this.tokenizer.link(src, p)) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if (token = this.tokenizer.reflink(src, p, this.tokens.links)) {
        p += token.raw.length;
        const lastToken = tokens.at(-1);
        if (token.type === 'text' && lastToken?.type === 'text') {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }

      if (token = this.tokenizer.emStrong(src, p, maskedSrc, prevChar)) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if (token = this.tokenizer.codespan(src, p)) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if (token = this.tokenizer.br(src, p)) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if (token = this.tokenizer.del(src, p, maskedSrc, prevChar)) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if (token = this.tokenizer.autolink(src, p)) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      if (!this.state.inLink && (token = this.tokenizer.url(src, p))) {
        p += token.raw.length;
        tokens.push(token);
        continue;
      }

      // Fast plain-text path: scan a run of characters that cannot start an
      // inline token, mirroring the GFM text regex's match exactly.
      const runLen = scanPlainText(src, p, len, hasAt);
      if (runLen > 0) {
        const raw = src.slice(p, p + runLen);
        const escaped = this.state.inRawBlock;
        token = {
          type: 'text',
          raw,
          text: escaped || !raw.includes('&') ? raw : decodeNumericCharacterReferences(raw),
          escaped,
        };
        p += runLen;
        if (token.raw.slice(-1) !== '_') {
          prevChar = token.raw.slice(-1);
        }
        keepPrevChar = true;
        const lastToken = tokens.at(-1);
        if (lastToken?.type === 'text') {
          lastToken.raw += token.raw;
          lastToken.text += token.text;
        } else {
          tokens.push(token);
        }
        continue;
      }

      if (p < len) {
        throw new Error('Infinite loop on byte: ' + src.charCodeAt(p));
      }
    }
    return tokens;
  }

  maskSrc(src) {
    if (!src.includes('[') && !src.includes('`') && !src.includes('\\') && !src.includes('<')) {
      return src;
    }
    let maskedSrc = src;

    if (this.tokens.links && src.includes('[')) {
      const reflinkSearch = inline.reflinkSearch;
      const maskReflink = (match0) => {
        const refStart = match0.lastIndexOf('[');
        if (!Object.hasOwn(this.tokens.links, normalizeLabel(match0.slice(refStart + 1, -1)))) {
          return match0;
        }
        if (refStart > 1 && match0.charAt(0) !== '!') {
          const text = match0.slice(1, refStart - 1);
          if (this.linkInText(text)) {
            return '[' + text.replace(reflinkSearch, maskReflink)
              + '][' + 'a'.repeat(match0.length - refStart - 2) + ']';
          }
        }
        return '[' + 'a'.repeat(match0.length - 2) + ']';
      };
      maskedSrc = maskedSrc.replace(reflinkSearch, maskReflink);
    }

    if (src.includes('\\') || src.includes('`')) {
      maskedSrc = maskedSrc.replace(inline.anyPunctuationOutsideCode, (match0, code, punct) => {
        if (punct) {
          return '+'.repeat(match0.length);
        }
        if (code) {
          return code + match0.slice(code.length, -code.length).replace(/`/g, '+') + code;
        }
        return match0;
      });
    }

    if (src.includes('[') || src.includes('`') || src.includes('<')) {
      maskedSrc = maskedSrc.replace(inline.blockSkip, (match0, _link, context) => {
        const offset = context ? context.length : 0;
        return match0.slice(0, offset) + '[' + 'a'.repeat(match0.length - offset - 2) + ']';
      });
    }

    return maskedSrc;
  }
}

// ---- Renderer ----
class Renderer {
  constructor() {
    this.parser = null;
  }

  space() { return ''; }

  code({ text, lang, escaped }) {
    const langString = (lang || '').match(other.notSpaceStart)?.[0];
    const code = text ? text.replace(other.endingNewline, '') + '\n' : '';
    if (!langString) {
      return '<pre><code>' + (escaped ? code : escapeHtmlEntities(code, true)) + '</code></pre>\n';
    }
    return '<pre><code class="language-'
      + escapeHtmlEntities(langString)
      + '">'
      + (escaped ? code : escapeHtmlEntities(code, true))
      + '</code></pre>\n';
  }

  blockquote({ tokens }) {
    const body = this.parser.parse(tokens);
    return `<blockquote>\n${body}</blockquote>\n`;
  }

  html({ text }) {
    return text;
  }

  def() { return ''; }

  heading({ tokens, depth }) {
    return `<h${depth}>${this.parser.parseInline(tokens)}</h${depth}>\n`;
  }

  hr() { return '<hr>\n'; }

  list(token) {
    const ordered = token.ordered;
    const start = token.start;
    let body = '';
    for (let j = 0; j < token.items.length; j++) {
      body += this.listitem(token.items[j]);
    }
    const type = ordered ? 'ol' : 'ul';
    const startAttr = (ordered && start !== 1) ? (' start="' + start + '"') : '';
    return '<' + type + startAttr + '>\n' + body + '</' + type + '>\n';
  }

  listitem(item) {
    return `<li>${this.parser.parse(item.tokens)}</li>\n`;
  }

  checkbox({ checked }) {
    return '<input ' + (checked ? 'checked="" ' : '') + 'disabled="" type="checkbox"> ';
  }

  paragraph({ tokens }) {
    return `<p>${this.parser.parseInline(tokens)}</p>\n`;
  }

  table(token) {
    let header = '';
    let cell = '';
    for (let j = 0; j < token.header.length; j++) {
      cell += this.tablecell(token.header[j]);
    }
    header += this.tablerow({ text: cell });
    let body = '';
    for (let j = 0; j < token.rows.length; j++) {
      const row = token.rows[j];
      cell = '';
      for (let k = 0; k < row.length; k++) {
        cell += this.tablecell(row[k]);
      }
      body += this.tablerow({ text: cell });
    }
    if (body) body = `<tbody>${body}</tbody>`;
    return '<table>\n' + '<thead>\n' + header + '</thead>\n' + body + '</table>\n';
  }

  tablerow({ text }) {
    return `<tr>\n${text}</tr>\n`;
  }

  tablecell(token) {
    const content = this.parser.parseInline(token.tokens);
    const type = token.header ? 'th' : 'td';
    const tag = token.align ? `<${type} align="${token.align}">` : `<${type}>`;
    return tag + content + `</${type}>\n`;
  }

  strong({ tokens }) {
    return `<strong>${this.parser.parseInline(tokens)}</strong>`;
  }

  em({ tokens }) {
    return `<em>${this.parser.parseInline(tokens)}</em>`;
  }

  codespan({ text }) {
    return `<code>${escapeHtmlEntities(text, true)}</code>`;
  }

  br() { return '<br>'; }

  del({ tokens }) {
    return `<del>${this.parser.parseInline(tokens)}</del>`;
  }

  link({ href, title, text, tokens, autolink }) {
    const parsedText = autolink
      ? escapeHtmlEntities(text, true)
      : this.parser.parseInline(tokens);
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return parsedText;
    }
    href = escapeHtmlEntities(cleanHref, autolink);
    let out = '<a href="' + href + '"';
    if (title) {
      out += ' title="' + (escapeHtmlEntities(title)) + '"';
    }
    out += '>' + parsedText + '</a>';
    return out;
  }

  image({ href, title, text, tokens }) {
    if (tokens) {
      text = this.parser.parseInline(tokens, this.parser.textRenderer);
    }
    const cleanHref = cleanUrl(href);
    if (cleanHref === null) {
      return escapeHtmlEntities(text);
    }
    href = cleanHref;
    let out = `<img src="${escapeHtmlEntities(href)}" alt="${escapeHtmlEntities(text)}"`;
    if (title) {
      out += ` title="${escapeHtmlEntities(title)}"`;
    }
    out += '>';
    return out;
  }

  text(token) {
    return 'tokens' in token && token.tokens
      ? this.parser.parseInline(token.tokens)
      : ('escaped' in token && token.escaped ? token.text : escapeHtmlEntities(token.text));
  }
}

class TextRenderer {
  constructor() {
    this.parser = null;
  }

  strong({ text, tokens }) {
    return tokens ? this.parser.parseInline(tokens, this) : text;
  }

  em({ text, tokens }) {
    return tokens ? this.parser.parseInline(tokens, this) : text;
  }

  codespan({ text }) {
    return text;
  }

  del({ text, tokens }) {
    return tokens ? this.parser.parseInline(tokens, this) : text;
  }

  html({ text }) {
    return text;
  }

  text({ text }) {
    return text;
  }

  link({ text, tokens }) {
    return tokens ? this.parser.parseInline(tokens, this) : text;
  }

  image({ text, tokens }) {
    return tokens ? this.parser.parseInline(tokens, this) : text;
  }

  br() { return ''; }

  checkbox({ raw }) {
    return raw;
  }
}

// ---- Parser ----
class Parser {
  constructor() {
    this.renderer = new Renderer();
    this.renderer.parser = this;
    this.textRenderer = new TextRenderer();
    this.textRenderer.parser = this;
  }

  parse(tokens) {
    this.renderer.parser = this;
    let out = '';
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      switch (token.type) {
        case 'space': out += this.renderer.space(token); break;
        case 'hr': out += this.renderer.hr(token); break;
        case 'heading': out += this.renderer.heading(token); break;
        case 'code': out += this.renderer.code(token); break;
        case 'table': out += this.renderer.table(token); break;
        case 'blockquote': out += this.renderer.blockquote(token); break;
        case 'list': out += this.renderer.list(token); break;
        case 'checkbox': out += this.renderer.checkbox(token); break;
        case 'html': out += this.renderer.html(token); break;
        case 'def': out += this.renderer.def(token); break;
        case 'paragraph': out += this.renderer.paragraph(token); break;
        case 'text': out += this.renderer.text(token); break;
        default: throw new Error('Token with "' + token.type + '" type was not found.');
      }
    }
    return out;
  }

  parseInline(tokens, renderer = this.renderer) {
    this.renderer.parser = this;
    let out = '';
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      switch (token.type) {
        case 'escape': out += renderer.text(token); break;
        case 'html': out += renderer.html(token); break;
        case 'link': out += renderer.link(token); break;
        case 'image': out += renderer.image(token); break;
        case 'checkbox': out += renderer.checkbox(token); break;
        case 'strong': out += renderer.strong(token); break;
        case 'em': out += renderer.em(token); break;
        case 'codespan': out += renderer.codespan(token); break;
        case 'br': out += renderer.br(token); break;
        case 'del': out += renderer.del(token); break;
        case 'text': out += renderer.text(token); break;
        default: throw new Error('Token with "' + token.type + '" type was not found.');
      }
    }
    return out;
  }
}

/** The HTML marked 18.1.3 renders for `markdown`, with marked's defaults. */
export function parse(markdown) {
  const lexer = new Lexer();
  const tokens = lexer.lex(markdown);
  const parser = new Parser();
  return parser.parse(tokens);
}
