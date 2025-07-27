import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // 인증 상태(isLoading, isAuthenticated)가 변경될 때마다 이 효과가 실행됩니다.
    
    // 로딩이 끝났고, 성공적으로 인증되었다면 대시보드로 이동합니다.
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }

    // 로딩이 끝났는데, 인증되지 않았다면 (예: 에러 발생) 로그인 페이지로 돌려보냅니다.
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

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