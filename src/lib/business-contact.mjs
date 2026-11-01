/** Contact destinations supplied by the operator; no inferred partnership or QR links. */
export const businessContacts = Object.freeze({
  email: 'remo@boam.tech',
  wechat: 'zeeeeyul',
  linkedin: 'https://www.linkedin.com/in/zeeyulkim/',
  remo: 'https://www.remo.re.kr/',
  boam: 'https://boam.tech/',
});
export function businessEmailHref(subject, body = '') {
  return `mailto:${businessContacts.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
