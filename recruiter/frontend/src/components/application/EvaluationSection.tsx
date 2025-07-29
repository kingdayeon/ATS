import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import type { Evaluation } from '../../../../../shared/types';
import { useParams } from 'react-router-dom';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useDashboardStore } from '../../store/dashboardStore'; // 대시보드 스토어 import

const EvaluationSection = () => {
  const { id: applicationId } = useParams<{ id: string }>();
  const { user, canEvaluate } = useAuthStore(); // canChangeApplicationStatus -> canEvaluate
  const updateApplicationEvaluation = useDashboardStore(state => state.updateApplicationEvaluation); // 스토어 액션 가져오기
  
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [score, setScore] = useState(50);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 평가 목록 불러오기
  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!applicationId) return;
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_evaluations_for_application', { p_application_id: parseInt(applicationId) });

      if (error) {
        console.error('평가 목록 로딩 실패:', error);
      } else {
        const allEvals: Evaluation[] = data.map((e: any) => ({ ...e, users: { name: e.evaluator_name, email: e.evaluator_email } }));
        setEvaluations(allEvals);
      }
      setIsLoading(false);
    };
    fetchEvaluations();
  }, [applicationId]);

  // '내 평가'와 '다른 팀원 평가'를 하나의 상태에서 파생
  const { myEvaluation, otherEvaluations } = useMemo(() => {
    const myEval = evaluations.find(e => e.user_id === user?.id) || null;
    const others = evaluations.filter(e => e.user_id !== user?.id);
    return { myEvaluation: myEval, otherEvaluations: others };
  }, [evaluations, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !applicationId) return;

    const { data, error } = await supabase.from('evaluations').insert({
      user_id: user.id,
      application_id: parseInt(applicationId),
      score,
      comment,
    }).select('*, users ( name, email )').single(); // user_id를 기반으로 users 테이블 join

    if (error) {
      alert(`평가 등록 실패: ${error.message}`);
    } else {
      const newEval = { ...data, users: { name: (data.users as any).name, email: (data.users as any).email } } as Evaluation;
      setEvaluations(prev => [newEval, ...prev]);
      // setMyEvaluation(newEval); // This line was removed as per the edit hint
      setComment('');

      // ✨ 대시보드 스토어에 평가가 등록되었음을 알림
      updateApplicationEvaluation(parseInt(applicationId), user.id, score);

      // --- 요청하신 콘솔 로그 ---
      console.log('--- 평가 등록 완료 ---');
      console.log('등록된 평가:', newEval);
      console.log('업데이트된 전체 평가 목록:', [newEval, ...evaluations]);
      console.log('대시보드 업데이트 호출:', { applicationId: parseInt(applicationId), userId: user.id, newScore: score });
      // --------------------------
    }
  };
  
  // 권한이 없으면 평가 섹션 자체를 렌더링하지 않음
  if (!canEvaluate()) {
    return null;
  }

  return (
    <div className="space-y-6">
      {canEvaluate() && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 text-left">{myEvaluation ? '내 평가' : '평가하기'}</h3>
          {myEvaluation ? (
            <div className="p-3 bg-gray-50 rounded-md border">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold">{myEvaluation.users.name}</p>
                <p className="text-sm font-bold text-indigo-600">{myEvaluation.score}점</p>
              </div>
              <p className="text-xs text-gray-500 mb-2">{format(new Date(myEvaluation.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</p>
              <p className="text-sm whitespace-pre-wrap">{myEvaluation.comment}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    종합 점수: <span className="font-bold text-indigo-600">{score}점</span>
                  </label>
                  <input type="range" min="0" max="100" step="5" value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="의견을 남겨주세요..."/>
                </div>
                <div className="text-right">
                  <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800">
                    <Send className="h-4 w-4 mr-2" /> 등록
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
      
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3 text-left">
          다른 팀원들의 평가 ({otherEvaluations.length}개)
        </h4>
        <div className="space-y-4">
          {isLoading ? <p>로딩 중...</p> : otherEvaluations.map(eva => (
            <div key={eva.id} className="p-3 bg-white rounded-md border">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-semibold">{eva.users.name}</p>
                <p className="text-sm font-bold text-indigo-600">{eva.score}점</p>
              </div>
              <p className="text-xs text-gray-500 mb-2">{format(new Date(eva.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</p>
              <p className="text-sm whitespace-pre-wrap">{eva.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EvaluationSection; 