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
  const { isLoading, isAuthenticated, setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // 1. 즉시 현재 세션 정보를 가져와서 상태를 설정
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. 이후의 인증 상태 변경을 감지하는 리스너 등록
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);

        // 사용자가 로그인했고, provider_refresh_token이 있는 경우에만 DB 업데이트
        if (_event === 'SIGNED_IN' && session?.provider_refresh_token) {
          const userEmail = session.user.email;
          if (userEmail) {
            supabase
              .from('users')
              .update({ provider_refresh_token: session.provider_refresh_token })
              .eq('email', userEmail)
              .then(({ error }) => {
                if (error) {
                  console.error('Refresh Token 저장 실패:', error);
                } else {
                  console.log('✅ Refresh Token이 DB에 성공적으로 저장되었습니다.');
                }
              });
          }
        }
      }
    );

    // setLoading(false)를 authStore의 setSession에서 처리하므로 여기서 호출할 필요 없음

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
