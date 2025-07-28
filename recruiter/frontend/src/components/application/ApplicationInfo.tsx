import type { Application, Job } from '../../../../../shared/types';
import StatusBadge from '../ui/StatusBadge'; // 통합 뱃지 import

interface ApplicationInfoProps {
  application: Application;
  job: Job;
}

const ApplicationInfo = ({ application, job }: ApplicationInfoProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* 프로필 헤더 */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{application.name}</h2>
        <p className="text-sm text-gray-500 mt-1">{application.english_name}</p>
        <div className="mt-4">
          <StatusBadge status={application.final_status !== 'pending' ? application.final_status : application.status} />
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="space-y-4">
        {/* 연락처 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">연락처</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              <span className="inline-block w-12">이메일</span>
              <span className="text-gray-900">{application.email}</span>
            </p>
            <p className="text-gray-600">
              <span className="inline-block w-12">전화</span>
              <span className="text-gray-900">{application.phone}</span>
            </p>
          </div>
        </div>

        {/* 지원 정보 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">지원 정보</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              <span className="inline-block w-16">직책</span>
              <span className="text-gray-900">{job.title}</span>
            </p>
            <p className="text-gray-600">
              <span className="inline-block w-16">부서</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border">
                {job.department}
              </span>
            </p>
            <p className="text-gray-600">
              <span className="inline-block w-16">경력</span>
              <span className="text-gray-900">{job.experience}</span>
            </p>
          </div>
        </div>

        {/* 지원 경로 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">지원 경로</h3>
          <p className="text-sm text-gray-600">{application.referral_source}</p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationInfo; 