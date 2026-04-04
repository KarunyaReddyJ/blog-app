function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafeHref(href: string) {
  const normalized = href.trim().toLowerCase();

  return (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('/') ||
    normalized.startsWith('#')
  );
}

export function sanitizeInlineHtml(value: string) {
  const tokens: string[] = [];

  const withTokens = value
    .replace(/<br\s*\/?>/gi, () => {
      const token = `__HTML_TOKEN_${tokens.length}__`;
      tokens.push('<br>');
      return token;
    })
    .replace(/<(\/?)(b|strong|i|em|mark|code)>/gi, (_match, slash: string, tag: string) => {
      const token = `__HTML_TOKEN_${tokens.length}__`;
      tokens.push(`<${slash}${tag.toLowerCase()}>`);
      return token;
    })
    .replace(/<a\s+[^>]*href=(["'])(.*?)\1[^>]*>/gi, (_match, _quote: string, href: string) => {
      const token = `__HTML_TOKEN_${tokens.length}__`;
      const safeHref = isSafeHref(href) ? escapeHtml(href.trim()) : '#';
      const external = safeHref.startsWith('http://') || safeHref.startsWith('https://');
      tokens.push(
        `<a href="${safeHref}"${external ? ' target="_blank" rel="noreferrer"' : ''}>`,
      );
      return token;
    })
    .replace(/<\/a>/gi, () => {
      const token = `__HTML_TOKEN_${tokens.length}__`;
      tokens.push('</a>');
      return token;
    });

  let sanitized = escapeHtml(withTokens);

  tokens.forEach((tokenValue, index) => {
    sanitized = sanitized.replace(`__HTML_TOKEN_${index}__`, tokenValue);
  });

  return sanitized;
}
