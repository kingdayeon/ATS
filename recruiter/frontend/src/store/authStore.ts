import { create } from 'zustand';
import type { User } from '../../../../shared/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  canAccessJob: (department: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: (user: User) => set({ 
    user, 
    isAuthenticated: true, 
    isLoading: false 
  }),

  logout: () => set({ 
    user: null, 
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
  }
})); 