// 사용자 권한 타입
export type UserRole = 'admin' | 'manager' | 'viewer';

// 사용자 정보 타입
export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  google_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// 채용공고 타입
export interface Job {
  id: number;
  title: string;
  company: string;
  department: string;
  experience: string;
  job_type: string;
  location: string;
  description?: string;
  team_intro?: string;
  responsibilities?: string[];
  requirements?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 지원서 타입
export interface Application {
  id: number;
  job_id: number;
  name: string;
  email: string;
  phone?: string;
  english_name: string;
  resume_file_url?: string;
  portfolio_type?: 'file' | 'link';
  portfolio_file_url?: string;
  portfolio_link?: string;
  referral_source?: string;
  custom_referral?: string;
  required_consent: boolean;
  optional_consent: boolean;
  status: 'submitted' | 'reviewing' | 'interview' | 'rejected' | 'accepted';
  created_at: string;
  updated_at: string;
}

// 채용공고 + 지원자 수 통계
export interface JobWithStats {
  job: Job;
  applicationCount: number;
  applications: Application[];
}

// 권한별 필터링을 위한 부서 매핑
export const DEPARTMENT_MAPPING = {
  Development: ['Backend Engineer', 'Frontend Engineer', 'Mobile Engineer', 'Engineering Manager'],
  Design: ['Design', 'Product Designer'],
  HR: [], // admin은 모든 부서 접근 가능
} as const; 