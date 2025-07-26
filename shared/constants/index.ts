import type { CompanyType, ReferralSource } from '../types';

// ===== COMPANY CONSTANTS =====
export const COMPANIES: CompanyType[] = [
  "29CM",
  "무신사", 
  "무신사 스탠다드",
  "무신사 로지스틱스",
  "무신사 페이먼츠"
];

// ===== DEPARTMENT CONSTANTS =====
export const DEPARTMENTS = [
  "Backend Engineer",
  "Business Development",
  "Business Management", 
  "Content",
  "Contents Marketing",
  "Design",
  "Engineering",
  "Engineering Manager",
  "Frontend Engineer",
  "Growth Marketing",
  "MD",
  "Marketing",
  "Mobile Engineer",
  "Off-Line",
  "Operation Management",
  "Product",
  "Product Designer",
  "Product Manager"
];

// ===== REFERRAL SOURCE CONSTANTS =====
export const REFERRAL_OPTIONS: ReferralSource[] = [
  "무신사 채용팀",
  "무신사 채용 홈페이지",
  "지인 추천", 
  "링크드인",
  "원티드",
  "리멤버",
  "사람인",
  "잡코리아",
  "검색 엔진",
  "외부 행사",
  "직접 입력"
];

// ===== COLOR MAPPING CONSTANTS =====
export const DEPARTMENT_COLORS: Record<string, string> = {
  'Frontend Engineer': 'bg-blue-100 text-blue-700 border-blue-200',
  'Backend Engineer': 'bg-green-100 text-green-700 border-green-200', 
  'Mobile Engineer': 'bg-purple-100 text-purple-700 border-purple-200',
  'Engineering Manager': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Product Designer': 'bg-pink-100 text-pink-700 border-pink-200',
  'Design': 'bg-orange-100 text-orange-700 border-orange-200',
  'Product Manager': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Growth Marketing': 'bg-red-100 text-red-700 border-red-200',
  'Contents Marketing': 'bg-red-100 text-red-700 border-red-200',
  'Business Development': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'MD': 'bg-teal-100 text-teal-700 border-teal-200',
  'Content': 'bg-violet-100 text-violet-700 border-violet-200',
  'Operation Management': 'bg-gray-100 text-gray-700 border-gray-200',
  'Off-Line': 'bg-slate-100 text-slate-700 border-slate-200'
};

export const STATUS_COLORS: Record<string, string> = {
  'submitted': 'bg-blue-50 border-blue-200',
  'interview': 'bg-purple-50 border-purple-200',
  'accepted': 'bg-green-50 border-green-200',
  'rejected': 'bg-red-50 border-red-200'
};

export const AVATAR_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
];

// ===== APPLICATION STATUS MAPPING =====
export const STATUS_DISPLAY_NAMES: Record<string, string> = {
  'submitted': '지원 접수',
  'interview': '면접 진행',
  'accepted': '최종 합격',
  'rejected': '불합격'
}; 