import { DEPARTMENT_COLORS, STATUS_COLORS, AVATAR_COLORS } from '../constants';

export const getAvatarColor = (name: string): string => {
  if (!name || typeof name !== 'string') return 'bg-gray-500';
  
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-rose-500'
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const getDepartmentColor = (department: string): string => {
  const colors: Record<string, string> = {
    'Frontend Engineer': 'border-blue-200 bg-blue-50 text-blue-700',
    'Backend Engineer': 'border-green-200 bg-green-50 text-green-700',
    'Design Lead': 'border-purple-200 bg-purple-50 text-purple-700',
    'Product Manager': 'border-orange-200 bg-orange-50 text-orange-700',
    'Data Analyst': 'border-indigo-200 bg-indigo-50 text-indigo-700',
    'QA Engineer': 'border-pink-200 bg-pink-50 text-pink-700',
  };
  
  return colors[department] || 'border-gray-200 bg-gray-50 text-gray-700';
};

// 📧 면접 일정 선택을 위한 보안 토큰 생성
export const generateInterviewToken = (applicationId: number): string => {
  // 실제로는 더 복잡한 JWT 토큰을 사용해야 하지만, 
  // 간단한 인코딩된 토큰으로 임시 구현
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const payload = `${applicationId}-${timestamp}-${randomStr}`;
  
  // Base64 인코딩 (실제로는 JWT 사용 권장)
  return btoa(payload).replace(/[+/=]/g, m => {
    return m === '+' ? '-' : m === '/' ? '_' : '';
  });
};

// 🔓 면접 토큰 검증 및 디코딩
export const validateInterviewToken = (token: string, applicationId: number): boolean => {
  try {
    // URL-safe base64 디코딩
    const normalizedToken = token.replace(/[-_]/g, m => m === '-' ? '+' : '/');
    const decoded = atob(normalizedToken);
    const [tokenAppId, timestamp, randomStr] = decoded.split('-');
    
    if (parseInt(tokenAppId) !== applicationId) {
      return false;
    }
    
    // 토큰 유효기간 체크 (24시간)
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    
    if (now - tokenTime > TWENTY_FOUR_HOURS) {
      console.warn('만료된 면접 토큰:', token);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('면접 토큰 검증 실패:', error);
    return false;
  }
};

// ===== TEXT UTILITIES =====

// 이니셜 생성 함수
export const getInitials = (name: string): string => {
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};

// 문자열 자르기 (설명 텍스트용)
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// 이메일 유효성 검사
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 전화번호 포매팅 (한국 전화번호)
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return phone;
};

// ===== DATE UTILITIES =====

// 날짜 포매팅 (한국어)
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// 상대 시간 표시 (예: "2시간 전")
export const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = [
    { label: '년', seconds: 31536000 },
    { label: '개월', seconds: 2592000 },
    { label: '일', seconds: 86400 },
    { label: '시간', seconds: 3600 },
    { label: '분', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      return `${count}${interval.label} 전`;
    }
  }

  return '방금 전';
};

// ===== FILE UTILITIES =====

// 파일 크기 포매팅
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 파일 확장자 검사
export const isValidFileType = (fileName: string, allowedTypes: string[]): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
};

// ===== URL UTILITIES =====

// URL 유효성 검사
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ===== CLASS NAME UTILITIES =====

// 클래스명 조건부 결합 (간단한 clsx 대체)
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

 