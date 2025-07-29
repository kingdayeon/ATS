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
    <div className="bg-white shadow-sm rounded-lg overflow-x-auto border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">지원 직책</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">평균 점수</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">내 평가</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {applications.map(app => {
            const averageScore = app.average_score != null ? Math.round(app.average_score) : null;
            const hasEvaluated = user ? (app.evaluator_ids || []).includes(user.id) : false;

            return (
              <tr key={app.id} onClick={() => navigate(`/application/${app.id}`)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.jobs?.title || getJobTitleById(app.job_id)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <StatusBadge status={app.final_status !== 'pending' ? app.final_status : app.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-800">
                  {averageScore !== null ? `${averageScore}점` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {hasEvaluated
                    ? <span className="font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200">평가 완료</span>
                    : <span className="font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">미평가</span>
                  }
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {applications.length === 0 && (
        <p className="text-center py-12 text-gray-500">조건에 맞는 지원자가 없습니다.</p>
      )}
    </div>
  );
};

export default ApplicantsTable; 