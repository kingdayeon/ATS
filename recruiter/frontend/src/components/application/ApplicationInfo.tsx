import type { Application, Job, ApplicationStatus } from '../../../../../shared/types';
import { getDepartmentColor } from '../../../../../shared/utils';

interface ApplicationInfoProps {
  application: Application;
  job: Job;
  getStatusText: (status: ApplicationStatus) => string;
  getStatusColor: (status: ApplicationStatus) => string;
}

const ApplicationInfo = ({ 
  application, 
  job, 
  getStatusText, 
  getStatusColor 
}: ApplicationInfoProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* 프로필 헤더 */}
      <div className="text-center mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{application.name}</h2>
          {application.english_name && (
            <p className="text-gray-600 mt-1">{application.english_name}</p>
          )}
        </div>
        
        {/* 상태 뱃지 */}
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
          {getStatusText(application.status)}
        </span>
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
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getDepartmentColor(job.department)}`}>
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