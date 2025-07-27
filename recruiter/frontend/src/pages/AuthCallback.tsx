import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // onAuthStateChange가 App.tsx에서 모든 것을 처리하므로,
    // 이 컴포넌트는 단순히 대시보드로 리디렉션하는 역할만 수행합니다.
    // 세션 처리는 App.tsx에 위임합니다.
    setLoading(true);
    // 세션이 설정될 시간을 약간 기다린 후 이동
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 1000); 
  }, [navigate, setLoading]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
};

export default AuthCallback; 