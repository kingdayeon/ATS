import { create } from 'zustand';
import type { User } from '../../../../shared/types';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (session: Session | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  canAccessJob: (department: string) => boolean;
  canChangeApplicationStatus: () => boolean;
  canEvaluate: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,

  setSession: async (session: Session | null) => {
    if (!session) {
      set({ session: null, user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // 세션이 있으면, users 테이블에서 상세 프로필 정보를 가져옵니다.
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (error) {
      console.error('사용자 프로필 조회 실패:', error);
      set({ session, user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    set({
      session,
      user: userProfile as User,
      isAuthenticated: true,
      isLoading: false
    });
  },

  logout: () => set({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: false
  }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  // 권한별 접근 제어 로직
  canAccessJob: (jobDepartment: string) => {
    const { user } = get();
    if (!user) return false;
    
    // admin은 모든 채용공고 접근 가능
    if (user.role === 'admin') return true;
    
    // Development 부서는 엔지니어 관련 공고만
    if (user.department === 'dev') {
      return ['Backend Engineer', 'Frontend Engineer', 'Mobile Engineer', 'Engineering Manager'].includes(jobDepartment);
    }
    
    // Design 부서는 디자인 관련 공고만
    if (user.department === 'design') {
      return ['Design', 'Product Designer'].includes(jobDepartment);
    }
    
    return false;
  },

  // 지원자 상태 변경 권한 (팀장 이상)
  canChangeApplicationStatus: () => {
    const { user } = get();
    return user?.role === 'admin' || user?.role === 'manager';
  },

  // viewer(팀원)도 평가할 수 있도록 새로운 권한 함수 추가
  canEvaluate: () => {
    const { user } = get();
    // 역할이 할당된 모든 사용자는 평가 가능
    return !!user?.role; 
  },
})); 