import { useEffect } from 'react';
import { useApplicantStore } from '../store/applicantStore';
import type { SortOption } from '../store/applicantStore';
import type { ApplicationStatus, FinalStatus } from '../../../../shared/types';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import FinalStatusBadge from '../components/ui/FinalStatusBadge';
import CustomDropdown from '../components/ui/CustomDropdown'; // 커스텀 드롭다운 import
import { Search } from 'lucide-react';

const ApplicantManagement = () => {
  const navigate = useNavigate();
  const {
    isLoading, error, fetchInitialData, filteredApplications,
    searchTerm, setSearchTerm,
    selectedJobId, setSelectedJobId, getAvailableJobs,
    selectedStatuses, toggleStatusFilter,
    sortOption, setSortOption, getJobTitleById,
  } = useApplicantStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const applications = filteredApplications();
  const availableJobs = getAvailableJobs();

  // 2. 뱃지 UI를 위한 상태 정보 객체
  const statusMap: Record<string, { text: string; className: string }> = {
    submitted: { text: '지원 접수', className: 'bg-gray-100 text-gray-800' },
    interview: { text: '면접 진행', className: 'bg-yellow-100 text-yellow-800' },
    accepted: { text: '입사 제안', className: 'bg-purple-100 text-purple-800' },
    rejected: { text: '불합격', className: 'bg-red-100 text-red-800' },
    hired: { text: '입사 결정', className: 'bg-green-100 text-green-800' },
    offer_declined: { text: '입사 취소', className: 'bg-yellow-100 text-yellow-800' },
  };
  const allStatuses = Object.keys(statusMap) as (ApplicationStatus | FinalStatus)[];

  // 드롭다운 옵션 포맷팅
  const jobOptions = [{ value: 'all', label: '모든 직무' }, ...availableJobs.map(j => ({ value: j.id, label: j.title }))];
  const sortOptions = [
    { value: 'latest', label: '최신순' },
    { value: 'name_asc', label: '이름순' },
    { value: 'status_asc', label: '상태순' },
  ];

  if (isLoading) return <LoadingSpinner message="지원자 정보 로딩 중..." />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 2. 헤더 구조 변경 */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link to="/dashboard" className="flex items-center gap-2 mr-6">
            <div className="w-8 h-8 bg-black flex items-center justify-center rounded-md">
              <span className="text-white font-bold text-lg">M</span>
            </div>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">지원자 통합 관리</h1>
        </div>
      </header>

      {/* 1. 메인 컨텐츠 영역 (스크롤 적용) */}
      <main className="flex-grow overflow-auto p-4 sm:p-6 lg:p-8">
        <p className="mb-6 text-sm text-gray-600">모든 채용 공고의 지원자 현황을 검색하고 관리합니다.</p>
        
        {/* Filters and Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="이름으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* 3. 커스텀 드롭다운 적용 */}
            <CustomDropdown
              options={jobOptions}
              value={selectedJobId}
              onChange={(val) => setSelectedJobId(val as 'all' | number)}
            />
            <CustomDropdown
              options={sortOptions}
              value={sortOption}
              onChange={(val) => setSortOption(val as SortOption)}
            />
          </div>
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {allStatuses.map(status => (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedStatuses.includes(status)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {statusMap[status]?.text || status}
              </button>
            ))}
          </div>
        </div>

        {/* 지원자 숫자 표시 (padding과 text-center 추가) */}
        <div className="py-5 text-center">
          <p className="text-sm font-medium text-gray-700">
            총 <span className="font-bold text-indigo-600">{applications.length}</span>건의 검색 결과
          </p>
        </div>

        {/* Applicant Table */}
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
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusMap[app.status]?.className || ''}`}>
                          {statusMap[app.status]?.text || app.status}
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
      </main>
    </div>
  );
};

export default ApplicantManagement; 