export interface UniversityInfo {
  code: string;
  name: string;
  shortName: string;
  domain: string;
  city: 'Hồ Chí Minh' | 'Hà Nội' | 'Đà Nẵng' | 'Vinh';
}

export const SUPPORTED_UNIVERSITIES: UniversityInfo[] = [
  { code: 'hcmut', name: 'Trường Đại học Bách Khoa - ĐHQG TP.HCM', shortName: 'HCMUT (Bách Khoa TP.HCM)', domain: 'hcmut.edu.vn', city: 'Hồ Chí Minh' },
  { code: 'hcmus', name: 'Trường Đại học Khoa học Tự nhiên - ĐHQG TP.HCM', shortName: 'HCMUS (Tự Nhiên TP.HCM)', domain: 'hcmus.edu.vn', city: 'Hồ Chí Minh' },
  { code: 'uit', name: 'Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM', shortName: 'UIT (CNTT TP.HCM)', domain: 'uit.edu.vn', city: 'Hồ Chí Minh' },
  { code: 'hcmussh', name: 'Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQG TP.HCM', shortName: 'HCMUSSH (Nhân Văn TP.HCM)', domain: 'hcmussh.edu.vn', city: 'Hồ Chí Minh' },
  { code: 'hcmiu', name: 'Trường Đại học Quốc Tế - ĐHQG TP.HCM', shortName: 'HCMIU (ĐH Quốc Tế)', domain: 'hcmiu.edu.vn', city: 'Hồ Chí Minh' },
  { code: 'uel', name: 'Trường Đại học Kinh tế - Luật - ĐHQG TP.HCM', shortName: 'UEL (Kinh tế - Luật)', domain: 'uel.edu.vn', city: 'Hồ Chí Minh' },
  { code: 'hust', name: 'Đại học Bách Khoa Hà Nội', shortName: 'HUST (Bách Khoa Hà Nội)', domain: 'hust.edu.vn', city: 'Hà Nội' },
  { code: 'neu', name: 'Trường Đại học Kinh tế Quốc dân', shortName: 'NEU (Kinh tế Quốc dân)', domain: 'neu.edu.vn', city: 'Hà Nội' },
  { code: 'ftu', name: 'Trường Đại học Ngoại thương', shortName: 'FTU (Ngoại Thương)', domain: 'ftu.edu.vn', city: 'Hà Nội' },
  { code: 'ueh', name: 'Đại học Kinh tế TP. Hồ Chí Minh', shortName: 'UEH (ĐH Kinh Tế TP.HCM)', domain: 'ueh.edu.vn', city: 'Hồ Chí Minh' },
  { code: 'hcmute', name: 'Trường Đại học Sư phạm Kỹ thuật TP.HCM', shortName: 'HCMUTE (SPKT TP.HCM)', domain: 'hcmute.edu.vn', city: 'Hồ Chí Minh' },
  { code: 'tdtu', name: 'Trường Đại học Tôn Đức Thắng', shortName: 'TDTU (Tôn Đức Thắng)', domain: 'tdtu.edu.vn', city: 'Hồ Chí Minh' },
  { code: 'utc', name: 'Trường Đại học Giao thông Vận tải', shortName: 'UTC (Giao Thông Vận Tải)', domain: 'utc.edu.vn', city: 'Hà Nội' },
  { code: 'tlu', name: 'Trường Đại học Thủy lợi', shortName: 'TLU (Thủy Lợi)', domain: 'tlu.edu.vn', city: 'Hà Nội' },
  { code: 'dtu', name: 'Đại học Duy Tân', shortName: 'DTU (Duy Tân Đà Nẵng)', domain: 'duytan.edu.vn', city: 'Đà Nẵng' },
  { code: 'hutech', name: 'Trường Đại học Công nghệ TP.HCM', shortName: 'HUTECH', domain: 'hutech.edu.vn', city: 'Hồ Chí Minh' },
  { code: 'uef', name: 'Trường Đại học Kinh tế - Tài chính TP.HCM', shortName: 'UEF', domain: 'uef.edu.vn', city: 'Hồ Chí Minh' },
  { code: 'vanlanguni', name: 'Trường Đại học Văn Lang', shortName: 'Van Lang University', domain: 'vlu.edu.vn', city: 'Hồ Chí Minh' },
  { code: 'vinhuni', name: 'Trường Đại học Vinh', shortName: 'Vinh University', domain: 'vinhuni.edu.vn', city: 'Vinh' },
  { code: 'rmit', name: 'RMIT University Vietnam', shortName: 'RMIT Vietnam', domain: 'rmit.edu.vn', city: 'Hồ Chí Minh' },
];

export function detectUniversityFromEmail(email: string): UniversityInfo | null {
  const normalized = email.toLowerCase().trim();
  for (const uni of SUPPORTED_UNIVERSITIES) {
    if (
      normalized.includes(uni.code) ||
      normalized.includes(`@${uni.domain}`) ||
      normalized.includes(`.${uni.domain}`)
    ) {
      return uni;
    }
  }
  return null;
}
