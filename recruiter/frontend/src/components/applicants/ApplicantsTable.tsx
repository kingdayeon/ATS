import { useNavigate } from 'react-router-dom';
import { useApplicantStore } from '../../store/applicantStore';
import { useAuthStore } from '../../store/authStore'; // authStore 추가
import StatusBadge from '../ui/StatusBadge';

const ApplicantsTable = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore(); // 현재 유저 정보
  const { filteredApplications, getJobTitleById } = useApplicantStore();
  const applications = filteredApplications();

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full divide-y divide-gray-200 table-fixed">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">이름</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">이메일</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">지원 직책</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">상태</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">서류 평균</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">면접 평균</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">총 평균</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">서류 평가</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">면접 평가</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {applications.map(app => {
            // 현재 상태에 따라 적절한 평가 정보 선택
            const isDocumentStage = app.status === 'submitted';
            
            // 각 단계별 평가 정보 계산
            const documentScore = app.document_average_score != null ? Math.round(app.document_average_score) : null;
            const interviewScore = app.interview_average_score != null ? Math.round(app.interview_average_score) : null;
            const totalAverageScore = (documentScore !== null && interviewScore !== null) 
              ? Math.round((documentScore + interviewScore) / 2) 
              : null;
            
            // 각 단계별 내 평가 여부
            const hasDocumentEvaluated = user ? (app.document_evaluator_ids || []).includes(user.id) : false;
            const hasInterviewEvaluated = user ? (app.interview_evaluator_ids || []).includes(user.id) : false;

            return (
              <tr key={app.id} onClick={() => navigate(`/application/${app.id}`)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate">{app.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate">{app.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate">{app.jobs?.title || getJobTitleById(app.job_id)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <StatusBadge status={app.final_status !== 'pending' ? app.final_status : app.status} />
                </td>
                
                {/* 서류 평균 */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                  {documentScore !== null ? `${documentScore}점` : '평가 전'}
                </td>
                
                {/* 면접 평균 */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-600">
                  {interviewScore !== null ? `${interviewScore}점` : 
                   isDocumentStage ? '면접 진행 전' : '평가 전'}
                </td>
                
                {/* 총 평균 */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-purple-700">
                  {totalAverageScore !== null ? `${totalAverageScore}점` : '미정'}
                </td>
                
                {/* 서류 평가 */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <StatusBadge 
                    status={hasDocumentEvaluated ? 'evaluated' : 'not_evaluated'} 
                    customText={hasDocumentEvaluated ? '평가 완료' : '미평가'}
                    customClassName={hasDocumentEvaluated 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                    }
                  />
                </td>
                
                {/* 면접 평가 */}
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <StatusBadge 
                    status={hasInterviewEvaluated ? 'evaluated' : 'not_evaluated'} 
                    customText={
                      isDocumentStage ? '면접 진행 전' :
                      hasInterviewEvaluated ? '평가 완료' : '미평가'
                    }
                    customClassName={
                      isDocumentStage ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      hasInterviewEvaluated 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      {applications.length === 0 && (
        <p className="text-center py-12 text-gray-500">조건에 맞는 지원자가 없습니다.</p>
      )}
    </div>
  );
};

export default ApplicantsTable; 