/**
 * ISO 3166-1 alpha-2 country codes grouped by continent (one continent per country;
 * transcontinental countries use the usual convention, e.g. KZ and TR = Asia, RU = Europe).
 * Country names come from the browser/Node Intl API, so no name table is needed.
 */

export const CONTINENTS = {
  AF: 'Africa',
  AN: 'Antarctica',
  AS: 'Asia',
  EU: 'Europe',
  NA: 'North America',
  OC: 'Oceania',
  SA: 'South America',
} as const;
export type ContinentCode = keyof typeof CONTINENTS;

const BY_CONTINENT: Record<ContinentCode, string> = {
  AF: 'DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU YT MA MZ NA NE NG RE RW SH ST SN SC SL SO ZA SS SD TZ TG TN UG EH ZM ZW',
  AN: 'AQ BV GS HM TF',
  AS: 'AF AM AZ BH BD BT BN KH CN CY GE HK IN IO ID IR IQ IL JP JO KZ KW KG LA LB MO MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE',
  EU: 'AX AL AD AT BY BE BA BG HR CZ DK EE FO FI FR DE GI GR GG HU IS IE IM IT JE XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SJ SE CH UA GB VA',
  NA: 'AI AG AW BS BB BZ BM BQ VG CA KY CR CU CW DM DO SV GL GD GP GT HT HN JM MQ MX MS NI PA PR BL KN LC MF PM VC SX TT TC US VI UM',
  OC: 'AS AU CX CC CK FJ PF GU KI MH FM NR NC NZ NU NF MP PW PG PN WS SB TK TO TV VU WF',
  SA: 'AR BO BR CL CO EC FK GF GY PY PE SR UY VE',
};

const CONTINENT_OF = new Map<string, ContinentCode>();
for (const [continent, codes] of Object.entries(BY_CONTINENT) as [ContinentCode, string][]) {
  for (const code of codes.split(' ')) CONTINENT_OF.set(code, continent);
}

export function isCountryCode(code: string): boolean {
  return CONTINENT_OF.has(code);
}

export function continentOf(code: string): ContinentCode | undefined {
  return CONTINENT_OF.get(code);
}

let displayNames: Intl.DisplayNames | undefined;
export function countryName(code: string): string {
  try {
    displayNames ??= new Intl.DisplayNames(['en'], { type: 'region' });
    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** Regional-indicator flag emoji (shows as letters on platforms without flag glyphs). */
export function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
