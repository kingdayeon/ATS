import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

// 환경변수에서 Supabase 설정 가져오기
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// 개발 환경에서 환경변수 디버깅
if ((import.meta as any).env?.DEV) {
  console.log('🔍 Supabase 환경변수 상태:', {
    NODE_ENV: (import.meta as any).env?.MODE,
    DEV: (import.meta as any).env?.DEV,
    VITE_SUPABASE_URL: supabaseUrl ? '✅ 존재' : '❌ 없음',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '✅ 존재' : '❌ 없음',
    allEnv: Object.keys((import.meta as any).env || {}).filter((key: string) => key.startsWith('VITE_'))
  });
}

// 환경변수 검증
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = '❌ Supabase 환경변수가 누락되었습니다!\n필요한 환경변수: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY';
  
  if ((import.meta as any).env?.PROD) {
    // 프로덕션에서는 에러 throw
    throw new Error(errorMessage);
  } else {
    // 개발 환경에서는 콘솔 경고만
    console.error(errorMessage);
    console.error('현재 .env 파일 위치 확인 필요');
  }
}

// Supabase 클라이언트 생성
export const supabase = createClient<Database>(
  supabaseUrl || 'placeholder',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// ===== AUTH UTILITIES =====

// 현재 사용자 정보 가져오기
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};

// 로그아웃
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// ===== STORAGE UTILITIES =====

// 파일 업로드 헬퍼
export const uploadFile = async (
  file: File,
  bucket: string,
  filePath: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true // 같은 이름의 파일이 있으면 덮어쓰기
      });

    if (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }

    // 업로드된 파일의 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Failed to upload file:', error);
    return { success: false, error: 'Failed to upload file' };
  }
};

// 파일 삭제 헬퍼
export const deleteFile = async (
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete file:', error);
    return { success: false, error: 'Failed to delete file' };
  }
};

// ===== DATABASE HELPERS =====

// 타입 안전한 데이터베이스 쿼리 헬퍼
export const queryTable = <T extends keyof Database['public']['Tables']>(
  tableName: T
) => {
  return supabase.from(tableName);
};

// 타입 변환 유틸리티 (데이터베이스 타입 → 앱 타입)
export type DatabaseJob = Database['public']['Tables']['jobs']['Row'];
export type DatabaseApplication = Database['public']['Tables']['applications']['Row'];
export type DatabaseUser = Database['public']['Tables']['users']['Row']; 