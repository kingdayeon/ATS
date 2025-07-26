import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDashboardStore } from '../store/dashboardStore';
import DashboardHeader from '../components/ui/DashboardHeader';
import StatusColumn from '../components/ui/StatusColumn';
import type { ApplicationStatus } from '../../../../shared/types';

const Dashboard = () => {
  const { user, canAccessJob, logout } = useAuthStore();
  const {
    jobs,
    selectedJobId,
    isLoading,
    error,
    fetchJobs,
    setSelectedJob,
    getApplicationsByStatus,
    getJobById,
    updateApplicationStatus
  } = useDashboardStore();

  // 🚀 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // 🎯 권한에 따른 채용공고 필터링
  const filteredJobs = jobs.filter(job => canAccessJob(job.department));

  // 🔍 현재 선택된 채용공고
  const selectedJob = selectedJobId ? getJobById(selectedJobId) : null;

  // 🎯 채용공고 변경 핸들러
  const handleJobChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const jobId = parseInt(event.target.value);
    setSelectedJob(jobId);
  };

  // ⚡ 상태 변경 핸들러 (드래그앤드롭 + 메뉴 클릭)
  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      await updateApplicationStatus(applicationId, newStatus as ApplicationStatus);
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  // 🔄 로딩 중
  if (isLoading && !selectedJobId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  // ❌ 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen bg-gray-50 flex flex-col lg:overflow-hidden">
      {/* 📱 헤더 */}
      <DashboardHeader
        user={user!}
        jobs={filteredJobs}
        selectedJobId={selectedJobId}
        onJobChange={handleJobChange}
        onLogout={logout}
      />

      {/* 📊 메인 대시보드 */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col lg:min-h-0">
        {/* 🎯 선택된 채용공고 정보 */}
        {selectedJob && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
            </div>
            <p className="text-gray-600">
              {selectedJob.company} · {selectedJob.experience} · {selectedJob.location}
            </p>
          </div>
        )}

        {/* 📋 상태별 지원자 컬럼들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 lg:flex-1 lg:min-h-0 pb-4">
          <StatusColumn
            title="지원 접수"
            statusKey="submitted"
            items={getApplicationsByStatus('submitted')}
            emptyText="지원자가 없습니다"
            selectedJob={selectedJob || undefined}
            onStatusChange={handleStatusChange}
          />
          
          <StatusColumn
            title="면접 진행"
            statusKey="interview"
            items={getApplicationsByStatus('interview')}
            emptyText="면접 예정인 지원자가 없습니다"
            selectedJob={selectedJob || undefined}
            onStatusChange={handleStatusChange}
          />
          
          <StatusColumn
            title="입사 제안"
            statusKey="accepted"
            items={getApplicationsByStatus('accepted')}
            emptyText="입사 제안한 지원자가 없습니다"
            selectedJob={selectedJob || undefined}
            onStatusChange={handleStatusChange}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 