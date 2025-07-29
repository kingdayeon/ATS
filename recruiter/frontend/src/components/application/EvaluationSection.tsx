import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Send } from 'lucide-react';

const EvaluationSection = () => {
  const { canChangeApplicationStatus } = useAuthStore();
  const [score, setScore] = useState(50);
  const [comment, setComment] = useState('');

  // 평가 권한이 없으면 컴포넌트 자체를 렌더링하지 않음
  if (!canChangeApplicationStatus()) {
    return null;
  }

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScore(Number(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: DB 연동 로직 추가 예정
    console.log({ score, comment });
    alert('평가가 등록되었습니다. (UI 테스트)');
    setComment('');
  };

  return (
    <div className="border-t pt-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">평가하기</h3>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* 점수 입력 슬라이더 */}
          <div>
            <label htmlFor="score" className="block text-sm font-medium text-gray-700">
              종합 점수: <span className="font-bold text-indigo-600">{score}점</span>
            </label>
            <input
              id="score"
              type="range"
              min="0"
              max="100"
              step="5" // 10 -> 5로 수정
              value={score}
              onChange={handleScoreChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* 의견 입력 창 */}
          <div>
            <label htmlFor="comment" className="sr-only">의견</label>
            <textarea
              id="comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="의견을 남겨주세요..."
            />
          </div>

          {/* 제출 버튼 */}
          <div className="text-right">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
            >
              <Send className="h-4 w-4 mr-2" />
              등록
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EvaluationSection; 