/** Italian provinces (sigla, telephone prefix, postal code of the capoluogo) and international dialing prefixes. Reference data: check official sources before using it for anything formal. */

export interface Province {
  sigla: string;
  name: string;
  region: string;
  /** Telephone area code of the capoluogo, with the leading 0. */
  prefix: string;
  /** Postal code of the capoluogo: one code, or a range for cities with several. */
  cap: string;
}

type Row = [sigla: string, name: string, prefix: string, cap: string];

const REGIONS: Array<[string, Row[]]> = [
  ["Abruzzo", [["AQ", "L'Aquila", "0862", "67100"], ["CH", "Chieti", "0871", "66100"], ["PE", "Pescara", "085", "65100–65129"], ["TE", "Teramo", "0861", "64100"]]],
  ["Basilicata", [["MT", "Matera", "0835", "75100"], ["PZ", "Potenza", "0971", "85100"]]],
  ["Calabria", [["CZ", "Catanzaro", "0961", "88100"], ["CS", "Cosenza", "0984", "87100"], ["KR", "Crotone", "0962", "88900"], ["RC", "Reggio Calabria", "0965", "89100–89135"], ["VV", "Vibo Valentia", "0963", "89900"]]],
  ["Campania", [["AV", "Avellino", "0825", "83100"], ["BN", "Benevento", "0824", "82100"], ["CE", "Caserta", "0823", "81100"], ["NA", "Napoli", "081", "80121–80147"], ["SA", "Salerno", "089", "84121–84135"]]],
  ["Emilia-Romagna", [["BO", "Bologna", "051", "40121–40141"], ["FE", "Ferrara", "0532", "44121–44124"], ["FC", "Forlì-Cesena", "0543", "47121–47122"], ["MO", "Modena", "059", "41121–41126"], ["PR", "Parma", "0521", "43121–43126"], ["PC", "Piacenza", "0523", "29121–29122"], ["RA", "Ravenna", "0544", "48121–48124"], ["RE", "Reggio Emilia", "0522", "42121–42124"], ["RN", "Rimini", "0541", "47921–47924"]]],
  ["Friuli-Venezia Giulia", [["GO", "Gorizia", "0481", "34170"], ["PN", "Pordenone", "0434", "33170"], ["TS", "Trieste", "040", "34121–34151"], ["UD", "Udine", "0432", "33100"]]],
  ["Lazio", [["FR", "Frosinone", "0775", "03100"], ["LT", "Latina", "0773", "04100"], ["RI", "Rieti", "0746", "02100"], ["RM", "Roma", "06", "00118–00199"], ["VT", "Viterbo", "0761", "01100"]]],
  ["Liguria", [["GE", "Genova", "010", "16121–16167"], ["IM", "Imperia", "0183", "18100"], ["SP", "La Spezia", "0187", "19121–19138"], ["SV", "Savona", "019", "17100"]]],
  ["Lombardia", [["BG", "Bergamo", "035", "24121–24129"], ["BS", "Brescia", "030", "25121–25136"], ["CO", "Como", "031", "22100"], ["CR", "Cremona", "0372", "26100"], ["LC", "Lecco", "0341", "23900"], ["LO", "Lodi", "0371", "26900"], ["MN", "Mantova", "0376", "46100"], ["MI", "Milano", "02", "20121–20162"], ["MB", "Monza e della Brianza", "039", "20900"], ["PV", "Pavia", "0382", "27100"], ["SO", "Sondrio", "0342", "23100"], ["VA", "Varese", "0332", "21100"]]],
  ["Marche", [["AN", "Ancona", "071", "60121–60131"], ["AP", "Ascoli Piceno", "0736", "63100"], ["FM", "Fermo", "0734", "63900"], ["MC", "Macerata", "0733", "62100"], ["PU", "Pesaro e Urbino", "0721", "61121–61122"]]],
  ["Molise", [["CB", "Campobasso", "0874", "86100"], ["IS", "Isernia", "0865", "86170"]]],
  ["Piemonte", [["AL", "Alessandria", "0131", "15121–15122"], ["AT", "Asti", "0141", "14100"], ["BI", "Biella", "015", "13900"], ["CN", "Cuneo", "0171", "12100"], ["NO", "Novara", "0321", "28100"], ["TO", "Torino", "011", "10121–10156"], ["VB", "Verbano-Cusio-Ossola", "0323", "28922"], ["VC", "Vercelli", "0161", "13100"]]],
  ["Puglia", [["BA", "Bari", "080", "70121–70132"], ["BT", "Barletta-Andria-Trani", "0883", "76121"], ["BR", "Brindisi", "0831", "72100"], ["FG", "Foggia", "0881", "71121–71122"], ["LE", "Lecce", "0832", "73100"], ["TA", "Taranto", "099", "74121–74123"]]],
  ["Sardegna", [["CA", "Cagliari", "070", "09121–09134"], ["NU", "Nuoro", "0784", "08100"], ["OR", "Oristano", "0783", "09170"], ["SS", "Sassari", "079", "07100"], ["SU", "Sud Sardegna", "0781", "09013"]]],
  ["Sicilia", [["AG", "Agrigento", "0922", "92100"], ["CL", "Caltanissetta", "0934", "93100"], ["CT", "Catania", "095", "95121–95131"], ["EN", "Enna", "0935", "94100"], ["ME", "Messina", "090", "98121–98168"], ["PA", "Palermo", "091", "90121–90151"], ["RG", "Ragusa", "0932", "97100"], ["SR", "Siracusa", "0931", "96100"], ["TP", "Trapani", "0923", "91100"]]],
  ["Toscana", [["AR", "Arezzo", "0575", "52100"], ["FI", "Firenze", "055", "50121–50145"], ["GR", "Grosseto", "0564", "58100"], ["LI", "Livorno", "0586", "57121–57128"], ["LU", "Lucca", "0583", "55100"], ["MS", "Massa-Carrara", "0585", "54100"], ["PI", "Pisa", "050", "56121–56128"], ["PT", "Pistoia", "0573", "51100"], ["PO", "Prato", "0574", "59100"], ["SI", "Siena", "0577", "53100"]]],
  ["Trentino-Alto Adige", [["BZ", "Bolzano", "0471", "39100"], ["TN", "Trento", "0461", "38121–38123"]]],
  ["Umbria", [["PG", "Perugia", "075", "06121–06135"], ["TR", "Terni", "0744", "05100"]]],
  ["Valle d'Aosta", [["AO", "Aosta", "0165", "11100"]]],
  ["Veneto", [["BL", "Belluno", "0437", "32100"], ["PD", "Padova", "049", "35121–35143"], ["RO", "Rovigo", "0425", "45100"], ["TV", "Treviso", "0422", "31100"], ["VE", "Venezia", "041", "30121–30175"], ["VR", "Verona", "045", "37121–37142"], ["VI", "Vicenza", "0444", "36100"]]],
];

export const PROVINCES: Province[] = REGIONS.flatMap(([region, rows]) =>
  rows.map(([sigla, name, prefix, cap]) => ({ sigla, name, region, prefix, cap })),
).sort((a, b) => a.name.localeCompare(b.name, "it"));

export interface DialCode {
  country: string;
  /** ISO 3166-1 alpha-2. */
  iso: string;
  /** International calling code, without "+". */
  code: string;
}

type Dial = [country: string, iso: string, code: string];

const DIAL: Dial[] = [
  ["Afghanistan", "AF", "93"], ["Albania", "AL", "355"], ["Algeria", "DZ", "213"], ["Andorra", "AD", "376"], ["Arabia Saudita", "SA", "966"], ["Argentina", "AR", "54"],
  ["Armenia", "AM", "374"], ["Australia", "AU", "61"], ["Austria", "AT", "43"], ["Azerbaigian", "AZ", "994"], ["Belgio", "BE", "32"], ["Bielorussia", "BY", "375"],
  ["Bosnia ed Erzegovina", "BA", "387"], ["Brasile", "BR", "55"], ["Bulgaria", "BG", "359"], ["Canada", "CA", "1"], ["Cile", "CL", "56"], ["Cina", "CN", "86"],
  ["Cipro", "CY", "357"], ["Colombia", "CO", "57"], ["Corea del Sud", "KR", "82"], ["Costa Rica", "CR", "506"], ["Croazia", "HR", "385"], ["Cuba", "CU", "53"],
  ["Danimarca", "DK", "45"], ["Ecuador", "EC", "593"], ["Egitto", "EG", "20"], ["Emirati Arabi Uniti", "AE", "971"], ["Estonia", "EE", "372"], ["Filippine", "PH", "63"],
  ["Finlandia", "FI", "358"], ["Francia", "FR", "33"], ["Georgia", "GE", "995"], ["Germania", "DE", "49"], ["Giappone", "JP", "81"], ["Giordania", "JO", "962"],
  ["Gran Bretagna", "GB", "44"], ["Grecia", "GR", "30"], ["India", "IN", "91"], ["Indonesia", "ID", "62"], ["Iran", "IR", "98"], ["Iraq", "IQ", "964"],
  ["Irlanda", "IE", "353"], ["Islanda", "IS", "354"], ["Israele", "IL", "972"], ["Italia", "IT", "39"], ["Kazakistan", "KZ", "7"], ["Kenya", "KE", "254"],
  ["Lettonia", "LV", "371"], ["Libano", "LB", "961"], ["Libia", "LY", "218"], ["Liechtenstein", "LI", "423"], ["Lituania", "LT", "370"], ["Lussemburgo", "LU", "352"],
  ["Malta", "MT", "356"], ["Marocco", "MA", "212"], ["Messico", "MX", "52"], ["Moldavia", "MD", "373"], ["Monaco", "MC", "377"], ["Montenegro", "ME", "382"],
  ["Nigeria", "NG", "234"], ["Norvegia", "NO", "47"], ["Nuova Zelanda", "NZ", "64"], ["Paesi Bassi", "NL", "31"], ["Pakistan", "PK", "92"], ["Perù", "PE", "51"],
  ["Polonia", "PL", "48"], ["Portogallo", "PT", "351"], ["Qatar", "QA", "974"], ["Repubblica Ceca", "CZ", "420"], ["Romania", "RO", "40"], ["Russia", "RU", "7"],
  ["San Marino", "SM", "378"], ["Senegal", "SN", "221"], ["Serbia", "RS", "381"], ["Singapore", "SG", "65"], ["Siria", "SY", "963"], ["Slovacchia", "SK", "421"],
  ["Slovenia", "SI", "386"], ["Spagna", "ES", "34"], ["Stati Uniti", "US", "1"], ["Sudafrica", "ZA", "27"], ["Svezia", "SE", "46"], ["Svizzera", "CH", "41"],
  ["Thailandia", "TH", "66"], ["Tunisia", "TN", "216"], ["Turchia", "TR", "90"], ["Ucraina", "UA", "380"], ["Ungheria", "HU", "36"], ["Uruguay", "UY", "598"],
  ["Città del Vaticano", "VA", "39"], ["Venezuela", "VE", "58"], ["Vietnam", "VN", "84"],
];

export const DIAL_CODES: DialCode[] = DIAL.map(([country, iso, code]) => ({ country, iso, code })).sort((a, b) => a.country.localeCompare(b.country, "it"));

const clean = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** Matches the query against name, sigla, region, prefix and postal code; digits-only queries also match a CAP that starts with them. */
export function searchProvinces(query: string): Province[] {
  const q = clean(query).replace(/^\+/, "");
  if (!q) return PROVINCES;
  const found = PROVINCES.filter((p) => {
    if (clean(p.sigla) === q) return true;
    if (/^\d+$/.test(q)) return p.prefix.startsWith(q) || p.cap.replace(/–/g, " ").split(" ").some((c) => c.startsWith(q));
    return clean(p.name).includes(q) || clean(p.region).includes(q);
  });
  // An exact sigla ("MI") comes first, before names and regions that merely contain the letters.
  return found.sort((a, b) => Number(clean(b.sigla) === q) - Number(clean(a.sigla) === q));
}

/** Matches by country name, ISO code, or calling code (with or without "+"). */
export function searchDial(query: string): DialCode[] {
  const q = clean(query);
  if (!q) return DIAL_CODES;
  const digits = q.replace(/^\+|^00/, "");
  return DIAL_CODES.filter((d) => clean(d.country).includes(q) || d.iso.toLowerCase() === q || (/^\d+$/.test(digits) && d.code.startsWith(digits)));
}
