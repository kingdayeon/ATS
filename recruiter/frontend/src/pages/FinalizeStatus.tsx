import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // 경로 수정
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

const FinalizeStatus = () => {
  const { applicationId, finalStatus, token } = useParams<{ applicationId: string; finalStatus: string; token: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const finalizeStatus = async () => {
      try {
        if (!applicationId || !finalStatus || !token) {
          throw new Error('잘못된 접근입니다. URL을 확인해주세요.');
        }

        const { data, error } = await supabase.functions.invoke('set-final-status', {
          body: { applicationId, finalStatus, token },
        });

        if (error) throw new Error(error.message);
        if (!data.success) throw new Error(data.error || '상태 업데이트에 실패했습니다.');
        
        setResult({ success: true, message: data.message });
      } catch (err: any) {
        setResult({ success: false, message: err.message || '알 수 없는 오류가 발생했습니다.' });
      } finally {
        setIsLoading(false);
      }
    };

    finalizeStatus();
  }, [applicationId, finalStatus, token]);

  if (isLoading) {
    return <LoadingSpinner message="최종 상태를 업데이트하는 중입니다..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        {result?.success ? (
          <>
            <h1 className="text-2xl font-bold text-green-600 mb-4">✅ 처리 완료</h1>
            <p className="text-gray-700">{result.message}</p>
          </>
        ) : (
          <ErrorDisplay 
            message={result?.message || '오류가 발생했습니다.'} 
            retryText="홈페이지로 이동"
            onRetry={() => window.location.href = 'https://www.musinsa.com/app/careers/hr'} // 무신사 채용 홈페이지
          />
        )}
      </div>
    </div>
  );
};

export default FinalizeStatus; 