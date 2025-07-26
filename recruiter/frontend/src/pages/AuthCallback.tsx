import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login, setLoading } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setLoading(true);

        // 1. Supabase에서 세션 가져오기
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user?.email) {
          throw new Error('로그인 정보를 찾을 수 없습니다.');
        }

        // 2. users 테이블에서 사용자 정보 조회
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();

        if (userError || !userData) {
          throw new Error('권한이 없는 사용자입니다. 관리자에게 문의하세요.');
        }

        // 3. 사용자 정보를 스토어에 저장
        login(userData);

        // 4. 대시보드로 리다이렉트
        navigate('/dashboard', { replace: true });

      } catch (error) {
        console.error('인증 처리 실패:', error);
        alert(error instanceof Error ? error.message : '로그인에 실패했습니다.');
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, login, setLoading]);

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