import { useNavigate } from 'react-router-dom';
import { useApplicantStore } from '../../store/applicantStore';
import FinalStatusBadge from '../ui/FinalStatusBadge';
import { STATUS_MAP } from '../../../../../shared/constants'; // 상수 import

const ApplicantsTable = () => {
  const navigate = useNavigate();
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
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {applications.map(app => (
            <tr key={app.id} onClick={() => navigate(`/application/${app.id}`)} className="hover:bg-gray-50 cursor-pointer">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.jobs?.title || getJobTitleById(app.job_id)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {app.final_status !== 'pending'
                  ? <FinalStatusBadge status={app.final_status} />
                  : (
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_MAP[app.status]?.className || ''}`}>
                      {STATUS_MAP[app.status]?.text || app.status}
                    </span>
                  )
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {applications.length === 0 && (
        <p className="text-center py-12 text-gray-500">조건에 맞는 지원자가 없습니다.</p>
      )}
    </div>
  );
};

export default ApplicantsTable; 