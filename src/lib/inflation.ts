export type InflationCurrency = "EUR" | "USD" | "JPY";

/**
 * Annual average consumer price index, one series per currency (the base year differs, only ratios are used).
 * EUR: Eurostat HICP, euro area (prc_hicp_aind, 2015 = 100). USD: World Bank FP.CPI.TOTL for the United States (2010 = 100).
 * JPY: World Bank FP.CPI.TOTL for Japan (2010 = 100).
 */
export const CPI: Record<InflationCurrency, Record<number, number>> = {
  EUR: {
    1996: 71.74, 1997: 72.87, 1998: 73.67, 1999: 74.48, 2000: 76.05, 2001: 77.83, 2002: 79.58, 2003: 81.24, 2004: 82.98, 2005: 84.79,
    2006: 86.64, 2007: 88.49, 2008: 91.38, 2009: 91.65, 2010: 93.14, 2011: 95.66, 2012: 98.05, 2013: 99.38, 2014: 99.81, 2015: 100,
    2016: 100.23, 2017: 101.78, 2018: 103.56, 2019: 104.8, 2020: 105.06, 2021: 107.78, 2022: 116.82, 2023: 123.15, 2024: 126.07, 2025: 128.75,
  },
  USD: {
    1990: 59.920, 1991: 62.457, 1992: 64.349, 1993: 66.248, 1994: 67.976, 1995: 69.883, 1996: 71.931, 1997: 73.613, 1998: 74.755, 1999: 76.391,
    2000: 78.971, 2001: 81.203, 2002: 82.490, 2003: 84.363, 2004: 86.622, 2005: 89.561, 2006: 92.450, 2007: 95.087, 2008: 98.737, 2009: 98.386,
    2010: 100.000, 2011: 103.157, 2012: 105.292, 2013: 106.834, 2014: 108.567, 2015: 108.696, 2016: 110.067, 2017: 112.412, 2018: 115.157,
    2019: 117.244, 2020: 118.691, 2021: 124.266, 2022: 134.211, 2023: 139.736, 2024: 143.857,
  },
  JPY: {
    1990: 94.534, 1991: 97.608, 1992: 99.326, 1993: 100.561, 1994: 101.260, 1995: 101.131, 1996: 101.269, 1997: 103.039, 1998: 103.721, 1999: 103.367,
    2000: 102.668, 2001: 101.908, 2002: 100.967, 2003: 100.708, 2004: 100.699, 2005: 100.414, 2006: 100.665, 2007: 100.725, 2008: 102.115, 2009: 100.734,
    2010: 100.000, 2011: 99.728, 2012: 99.684, 2013: 100.018, 2014: 102.777, 2015: 103.595, 2016: 103.463, 2017: 103.964, 2018: 104.992,
    2019: 105.484, 2020: 105.458, 2021: 105.212, 2022: 107.840, 2023: 111.364, 2024: 114.414, 2025: 118.044,
  },
};

/** First and last year with data for a currency. */
export function yearRange(currency: InflationCurrency): { first: number; last: number } {
  const years = Object.keys(CPI[currency]).map(Number);
  return { first: Math.min(...years), last: Math.max(...years) };
}

export type InflationResult = {
  /** The amount with the buying power of `to`, in the same currency. */
  value: number;
  /** Price change between the two years, in percent (negative when `to` is before `from`). */
  total: number;
  /** Compound yearly rate over the period, in percent; null when both years are the same. */
  yearly: number | null;
};

/** What `amount` of year `from` is worth in year `to`. Returns null for a year without data. */
export function adjust(currency: InflationCurrency, amount: number, from: number, to: number): InflationResult | null {
  const series = CPI[currency];
  const a = series[from];
  const b = series[to];
  if (a === undefined || b === undefined) return null;
  const ratio = b / a;
  const years = Math.abs(to - from);
  return { value: amount * ratio, total: (ratio - 1) * 100, yearly: years === 0 ? null : (Math.pow(ratio, 1 / (to - from)) - 1) * 100 };
}
