import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDashboardStore } from '../store/dashboardStore';
import type { ApplicationStatus } from '../../../../shared/types';

// 컴포넌트들
import DashboardHeader from '../components/ui/DashboardHeader';
import JobSelector from '../components/dashboard/JobSelector';
import DashboardGrid from '../components/dashboard/DashboardGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

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

  // 🎯 첫 번째 접근 가능한 job 자동 선택
  useEffect(() => {
    if (filteredJobs.length > 0 && !selectedJobId) {
      const firstJobId = filteredJobs[0].id;
      console.log(`🎯 첫 번째 접근 가능한 job 선택: ${firstJobId}`);
      setSelectedJob(firstJobId);
    }
  }, [filteredJobs, selectedJobId, setSelectedJob]);

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
    return <LoadingSpinner message="대시보드 로딩 중..." />;
  }

  // ❌ 에러 상태
  if (error) {
    return (
      <ErrorDisplay 
        message={error} 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  // 🚫 접근 가능한 채용공고가 없는 경우
  if (filteredJobs.length === 0 && jobs.length > 0) {
    return (
      <ErrorDisplay 
        message="접근 권한이 있는 채용공고가 없습니다." 
        onRetry={() => logout()}
        retryText="로그아웃"
      />
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
        <JobSelector selectedJob={selectedJob} />

        {/* 📋 상태별 지원자 컬럼들 */}
        <DashboardGrid
          getApplicationsByStatus={getApplicationsByStatus}
          selectedJob={selectedJob}
          onStatusChange={handleStatusChange}
        />
      </main>
    </div>
  );
};

export default Dashboard; 