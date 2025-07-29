import { useEffect } from 'react';
import { useApplicantStore } from '../store/applicantStore';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import ApplicantFilters from '../components/applicants/ApplicantFilters';
import ApplicantsTable from '../components/applicants/ApplicantsTable';

const ApplicantManagement = () => {
  const { isLoading, error, fetchInitialData, filteredApplications } = useApplicantStore();

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const applications = filteredApplications();

  if (isLoading) return <LoadingSpinner message="지원자 정보 로딩 중..." />;
  if (error) return <ErrorDisplay message={error} />;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
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

      <main className="flex-grow overflow-auto p-4 sm:p-6 lg:p-8 scrollbar-hide">
        <p className="mb-6 text-sm text-gray-600">모든 채용 공고의 지원자 현황을 검색하고 관리합니다.</p>
        
        <ApplicantFilters />

        <div className="py-5 text-center">
          <p className="text-sm font-medium text-gray-700">
            총 <span className="font-bold text-indigo-600">{applications.length}</span>건의 검색 결과
          </p>
        </div>

        <ApplicantsTable />
      </main>
    </div>
  );
};

export default ApplicantManagement; 