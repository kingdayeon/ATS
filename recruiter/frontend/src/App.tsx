import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import ApplicationDetail from './pages/ApplicationDetail';
import InterviewScheduling from './pages/InterviewScheduling';
import InterviewScheduled from './pages/InterviewScheduled';

function App() {
  const { user, isLoading, isAuthenticated, login, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        // 현재 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email) {
          // users 테이블에서 사용자 정보 조회
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();

          if (!userError && userData) {
            login(userData);
          }
        }
      } catch (error) {
        console.error('초기 인증 확인 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          // 로그아웃 처리는 AuthStore에서 직접 호출
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [login, setLoading]);

  // 로딩 중 표시
  if (isLoading) {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
      </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/interview-scheduling/:applicationId/:token" element={<InterviewScheduling />} />
        <Route path="/interview-scheduled/:applicationId" element={<InterviewScheduled />} />
        
        {/* 인증 필요 라우트 */}
        {isAuthenticated ? (
          <>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/application/:id" element={<ApplicationDetail />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

      </Routes>
    </Router>
  );
}

export default App;
