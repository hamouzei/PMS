export interface EthiopianDate {
  day: number;
  month: number;
  year: number;
  monthNameEn: string;
  monthNameAm: string;
}

export const ETHIOPIAN_MONTHS_EN = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yakatit',
  'Magabit', 'Miyazya', 'Genbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

export const ETHIOPIAN_MONTHS_AM = [
  'መስከረም', 'ጥቅምት', 'ሕዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

/**
 * Converts a Gregorian Date into Ethiopian Calendar Date (EFY).
 */
export function toEthiopianDate(gregorianDate: Date | string): EthiopianDate {
  const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate;
  if (isNaN(date.getTime())) {
    return { day: 1, month: 1, year: 2016, monthNameEn: 'Meskerem', monthNameAm: 'መስከረም' };
  }

  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();

  // Ethiopian New Year (1 Meskerem) starts on Sept 11 (or Sept 12 in leap year preceding Gregorian leap year)
  const isLeapYear = (gYear % 4 === 0 && gYear % 100 !== 0) || (gYear % 400 === 0);
  const newYearDay = ((gYear - 1) % 4 === 3) ? 12 : 11;

  let ethYear = gYear - 8;
  if (gMonth > 9 || (gMonth === 9 && gDay >= newYearDay)) {
    ethYear = gYear - 7;
  }

  // Calculate day difference from Ethiopian New Year
  const newYearDate = new Date(gYear, 8, newYearDay); // Sept 11/12
  let dayDiff = Math.floor((date.getTime() - newYearDate.getTime()) / (1000 * 60 * 60 * 24));

  if (dayDiff < 0) {
    const prevNewYearDate = new Date(gYear - 1, 8, ((gYear - 2) % 4 === 3) ? 12 : 11);
    dayDiff = Math.floor((date.getTime() - prevNewYearDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  let ethMonth = Math.floor(dayDiff / 30) + 1;
  let ethDay = (dayDiff % 30) + 1;

  if (ethMonth > 13) {
    ethMonth = 13;
  }

  return {
    day: ethDay,
    month: ethMonth,
    year: ethYear,
    monthNameEn: ETHIOPIAN_MONTHS_EN[ethMonth - 1] || 'Meskerem',
    monthNameAm: ETHIOPIAN_MONTHS_AM[ethMonth - 1] || 'መስከረም'
  };
}

export function formatEthiopianDate(gregorianDate: Date | string, useAmharic = false): string {
  const eth = toEthiopianDate(gregorianDate);
  const monthName = useAmharic ? eth.monthNameAm : eth.monthNameEn;
  return `${eth.day} ${monthName} ${eth.year} EFY`;
}
