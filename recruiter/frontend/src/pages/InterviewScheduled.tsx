import { useParams } from 'react-router-dom';

const InterviewScheduled = () => {
  const { applicationId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
        {/* 성공 아이콘 */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* 메시지 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          면접 일정이 확정되었습니다! 🎉
        </h1>
        
        <p className="text-gray-600 mb-6">
          선택하신 면접 시간으로 일정이 확정되었습니다.<br />
          면접관들에게 자동으로 알림이 발송되었습니다.
        </p>

        {/* 안내사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">📧 확인 메일</h3>
          <p className="text-sm text-blue-700">
            면접 상세 정보가 포함된 확인 메일이<br />
            등록하신 이메일로 발송됩니다.
          </p>
        </div>

        {/* 로고 */}
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="text-sm">무신사 ATS</span>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduled; 