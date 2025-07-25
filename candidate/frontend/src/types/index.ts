// ===== COMMON TYPES =====
export type JobType = "정규직" | "계약직" | "인턴" | "파트타임";
export type ExperienceLevel = "신입" | "경력 1년 이상" | "경력 3년 이상" | "경력 5년 이상" | "경력 7년 이상" | "경력 8년 이상" | "경력 10년 이상";
export type CompanyType = "29CM" | "무신사" | "무신사 스튜디오" | "무신사 로지스틱스" | "무신사 페이먼츠";

// ===== JOB RELATED TYPES =====
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
}

export interface JobListFilters {
  searchQuery: string;
  selectedCompanies: CompanyType[];
  selectedDepartments: string[];
}

// ===== APPLICATION FORM TYPES =====
export type PortfolioType = "file" | "link";
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

// ===== FILTER CONSTANTS =====
export const COMPANIES: CompanyType[] = [
  "29CM",
  "무신사", 
  "무신사 스튜디오",
  "무신사 로지스틱스",
  "무신사 페이먼츠"
];

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
  "Product"
];

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

// ===== MOCK DATA TYPES =====
export interface MockJobData {
  [key: number]: Job;
} 