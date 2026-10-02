// Map an international phone number to its country flag emoji, based on the
// dialing (calling) code prefix. Longest-prefix match wins.

// calling code -> ISO 3166-1 alpha-2 country code
const CALLING_CODES: Record<string, string> = {
  '1': 'US', '7': 'RU', '20': 'EG', '27': 'ZA', '30': 'GR', '31': 'NL', '32': 'BE',
  '33': 'FR', '34': 'ES', '36': 'HU', '39': 'IT', '40': 'RO', '41': 'CH', '43': 'AT',
  '44': 'GB', '45': 'DK', '46': 'SE', '47': 'NO', '48': 'PL', '49': 'DE', '51': 'PE',
  '52': 'MX', '53': 'CU', '54': 'AR', '55': 'BR', '56': 'CL', '57': 'CO', '58': 'VE',
  '60': 'MY', '61': 'AU', '62': 'ID', '63': 'PH', '64': 'NZ', '65': 'SG', '66': 'TH',
  '81': 'JP', '82': 'KR', '84': 'VN', '86': 'CN', '90': 'TR', '91': 'IN', '92': 'PK',
  '93': 'AF', '94': 'LK', '95': 'MM', '98': 'IR',
  '211': 'SS', '212': 'MA', '213': 'DZ', '216': 'TN', '218': 'LY', '220': 'GM',
  '221': 'SN', '233': 'GH', '234': 'NG', '235': 'TD', '237': 'CM', '249': 'SD',
  '250': 'RW', '251': 'ET', '254': 'KE', '255': 'TZ', '256': 'UG', '260': 'ZM',
  '263': 'ZW', '264': 'NA', '265': 'MW', '267': 'BW',
  '351': 'PT', '352': 'LU', '353': 'IE', '354': 'IS', '355': 'AL', '356': 'MT',
  '357': 'CY', '358': 'FI', '359': 'BG', '370': 'LT', '371': 'LV', '372': 'EE',
  '373': 'MD', '375': 'BY', '380': 'UA', '381': 'RS', '385': 'HR', '386': 'SI',
  '387': 'BA', '420': 'CZ', '421': 'SK', '423': 'LI',
  '501': 'BZ', '502': 'GT', '503': 'SV', '504': 'HN', '505': 'NI', '506': 'CR',
  '507': 'PA', '509': 'HT', '591': 'BO', '593': 'EC', '595': 'PY', '598': 'UY',
  '852': 'HK', '853': 'MO', '855': 'KH', '856': 'LA', '880': 'BD', '886': 'TW',
  '960': 'MV', '961': 'LB', '962': 'JO', '963': 'SY', '964': 'IQ', '965': 'KW',
  '966': 'SA', '967': 'YE', '968': 'OM', '970': 'PS', '971': 'AE', '972': 'IL',
  '973': 'BH', '974': 'QA', '975': 'BT', '976': 'MN', '977': 'NP', '992': 'TJ',
  '993': 'TM', '994': 'AZ', '995': 'GE', '996': 'KG', '998': 'UZ'
};

function isoToFlag(iso: string): string {
  if (!iso || iso.length !== 2) return '';
  const A = 0x1f1e6;
  return String.fromCodePoint(A + iso.charCodeAt(0) - 65, A + iso.charCodeAt(1) - 65);
}

// Returns the flag emoji for a phone number (digits, no +). Longest match wins.
export function phoneToFlag(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '🌐';
  for (let len = 4; len >= 1; len--) {
    const iso = CALLING_CODES[digits.slice(0, len)];
    if (iso) return isoToFlag(iso);
  }
  return '🌐';
}
