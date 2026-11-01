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

/** Validated partner interests; accepts legacy outreach track links without changing URLs. */
export function meetingInterestFromHref(href) {
  try {
    const url = new URL(href, 'https://remo.invalid');
    const interest = url.searchParams.get('interest');
    if (interest && ['data', 'korea', 'distribution'].includes(interest)) return interest;
    return new Map([['physical_ai_data', 'data'], ['korea_entry', 'korea'], ['finefit', 'distribution']]).get(url.searchParams.get('track')) || '';
  } catch { return ''; }
}
