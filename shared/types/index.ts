// ===== COMMON ENUM TYPES =====
export type JobType = "정규직" | "계약직" | "인턴" | "파트타임";
export type ExperienceLevel = "신입" | "경력 1년 이상" | "경력 3년 이상" | "경력 5년 이상" | "경력 7년 이상" | "경력 8년 이상" | "경력 10년 이상";
export type CompanyType = "29CM" | "무신사" | "무신사 스탠다드" | "무신사 로지스틱스" | "무신사 페이먼츠";
export type PortfolioType = "file" | "link";
export type UserRole = 'admin' | 'manager' | 'viewer';
export type ApplicationStatus = 'submitted' | 'interview' | 'accepted' | 'rejected';

export type FinalStatus = 'pending' | 'hired' | 'offer_declined' | 'rejected';

export type ReferralSource = 
  | "무신사 채용팀"
  | "무신사 채용 홈페이지" 
  | "지인 추천"
  | "링크드인"
  | "원티드"
  | "리멤버"
  | "사람인"
  | "잡코리아"
  | "검색 엔진"
  | "외부 행사"
  | "직접 입력";

// ===== USER TYPES =====
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

// ===== JOB TYPES =====
export interface Job {
  id: number;
  title: string;
  company: CompanyType;
  department: string;
  experience: ExperienceLevel;
  type: JobType;
  location: string;
  description?: string;
  teamIntro?: string;
  responsibilities?: string[];
  requirements?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ===== APPLICATION TYPES =====
export interface Application {
  id: number;
  job_id: number;
  name: string;
  email: string;
  phone?: string;
  english_name: string;
  resume_file_url?: string;
  portfolio_type?: PortfolioType;
  portfolio_file_url?: string;
  portfolio_link?: string;
  referral_source?: ReferralSource;
  custom_referral?: string;
  required_consent: boolean;
  optional_consent: boolean;
  status: ApplicationStatus;
  final_status: FinalStatus;
  created_at: string;
  updated_at: string;
  jobs?: { title: string; department: string; }; // jobs 필드 추가
}

export interface ApplicationFormData {
  // 기본 정보
  name: string;
  email: string;
  phone: string;
  englishName: string;
  
  // 제출 서류
  resumeFile: File | null;
  portfolioType: PortfolioType;
  portfolioFile: File | null;
  portfolioLink: string;
  
  // 사전 질문
  referralSource: ReferralSource | "";
  customReferral: string;
  
  // 개인정보 동의
  allConsent: boolean;
  requiredConsent: boolean;
  optionalConsent: boolean;
}

// ===== COMBINED TYPES =====
export interface ApplicationWithJob extends Application {
  job?: Job;
}

export interface JobWithStats {
  job: Job;
  applicationCount: number;
  applications: Application[];
}

export interface JobListFilters {
  searchQuery: string;
  selectedCompanies: CompanyType[];
  selectedDepartments: string[];
}

// ===== COMPONENT PROPS TYPES =====
export interface FileUploadProps {
  title: string;
  description: string;
  isRequired?: boolean;
  acceptedTypes?: string;
  selectedFile?: File | null;
  onFileSelect: (file: File | null) => void;
}

export interface CheckboxFilterProps {
  title: string;
  options: string[];
  selectedOptions: string[];
  onOptionChange: (option: string, checked: boolean) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

// ===== VALIDATION TYPES =====
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface JobListResponse extends ApiResponse<Job[]> {
  total: number;
  page: number;
  limit: number;
}

export interface ApplicationSubmissionResponse extends ApiResponse<{
  applicationId: string;
  submittedAt: string;
}> {}

// ===== UTILITY TYPES =====
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredOnly<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;

// ===== DATABASE TYPES =====
export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: number
          title: string
          company: string
          department: string
          experience: string
          job_type: string
          location: string
          description?: string
          team_intro?: string
          responsibilities?: string[]
          requirements?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Insert: {
          title: string
          company: string
          department: string
          experience: string
          job_type: string
          location: string
          description?: string
          team_intro?: string
          responsibilities?: string[]
          requirements?: string
          is_active?: boolean
        }
        Update: {
          title?: string
          company?: string
          department?: string
          experience?: string
          job_type?: string
          location?: string
          description?: string
          team_intro?: string
          responsibilities?: string[]
          requirements?: string
          is_active?: boolean
        }
      }
      applications: {
        Row: {
          id: number
          job_id?: number
          name: string
          email: string
          phone?: string
          english_name: string
          resume_file_url?: string
          portfolio_type?: 'file' | 'link'
          portfolio_file_url?: string
          portfolio_link?: string
          referral_source?: string
          custom_referral?: string
          required_consent: boolean
          optional_consent?: boolean
          status?: 'submitted' | 'reviewing' | 'interview' | 'rejected' | 'accepted'
          created_at?: string
          updated_at?: string
        }
        Insert: {
          job_id?: number
          name: string
          email: string
          phone?: string
          english_name: string
          resume_file_url?: string
          portfolio_type?: 'file' | 'link'
          portfolio_file_url?: string
          portfolio_link?: string
          referral_source?: string
          custom_referral?: string
          required_consent: boolean
          optional_consent?: boolean
          status?: 'submitted' | 'reviewing' | 'interview' | 'rejected' | 'accepted'
        }
        Update: {
          job_id?: number
          name?: string
          email?: string
          phone?: string
          english_name?: string
          resume_file_url?: string
          portfolio_type?: 'file' | 'link'
          portfolio_file_url?: string
          portfolio_link?: string
          referral_source?: string
          custom_referral?: string
          required_consent?: boolean
          optional_consent?: boolean
          status?: 'submitted' | 'reviewing' | 'interview' | 'rejected' | 'accepted'
        }
      }
      users: {
        Row: {
          id: number
          email: string
          name: string
          role: 'admin' | 'manager' | 'viewer'
          department: string
          google_id?: string
          avatar_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          email: string
          name: string
          role: 'admin' | 'manager' | 'viewer'
          department: string
          google_id?: string
          avatar_url?: string
        }
        Update: {
          email?: string
          name?: string
          role?: 'admin' | 'manager' | 'viewer'
          department?: string
          google_id?: string
          avatar_url?: string
        }
      }
    }
  }
}

// ===== ROLE-BASED ACCESS CONTROL =====
export const DEPARTMENT_MAPPING = {
  Development: ['Backend Engineer', 'Frontend Engineer', 'Mobile Engineer', 'Engineering Manager'],
  Design: ['Design', 'Product Designer'],
  HR: [], // admin은 모든 부서 접근 가능
} as const; 

// calendar.ts에서 이동된 타입들
export interface InterviewSettings {
  dateRange: {
    start: string; // YYYY-MM-DD
    end: string;   // YYYY-MM-DD
  };
  timeRange: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
  duration: number; // 분 단위
  applicationId: number;
  department: string;
}

export interface TimeSlot {
  start: string; // ISO 문자열
  end: string;   // ISO 문자열
  available: boolean;
} 