import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../store/authStore';
import { useDashboardStore } from '../store/dashboardStore';
import type { Application, ApplicationStatus, FinalStatus, InterviewSettings } from '../../../../shared/types';
// �� [제거] import type { InterviewSettings } from '../services/calendar';

// 컴포넌트들
import DashboardHeader from '../components/ui/DashboardHeader';
import JobSelector from '../components/dashboard/JobSelector';
import DashboardGrid from '../components/dashboard/DashboardGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import InterviewScheduleModal from '../components/interview/InterviewScheduleModal';
import CustomDropdown from '../components/ui/CustomDropdown'; // 커스텀 드롭다운 import
import type { SortOption } from '../store/dashboardStore'; // SortOption 타입 import

const sortApplications = (apps: Application[], option: SortOption): Application[] => {
  switch (option) {
    case 'oldest':
      return [...apps].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    case 'score_desc':
      return [...apps].sort((a, b) => (b.average_score || 0) - (a.average_score || 0));
    case 'score_asc':
      return [...apps].sort((a, b) => (a.average_score || 0) - (b.average_score || 0));
    case 'latest':
    default:
      return [...apps].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
};

const Dashboard = () => {
  const { user, canAccessJob, logout } = useAuthStore();
  const {
    jobs,
    selectedJobId,
    isLoading,
    error,
    fetchInitialData, // 올바른 함수 이름
    setSelectedJob,
    getApplicationsByStatus,
    getApplicationsByFinalStatus, // 추가
    getJobById,
    updateApplicationStatus,
    sortOption, setSortOption, // 정렬 상태와 액션 추가
    getApplicationById
  } = useDashboardStore();

  // 🚀 면접 일정 설정 모달 상태
  const [scheduleModal, setScheduleModal] = useState<{
    isOpen: boolean;
    applicationId: number | null;
    applicantName: string;
    department: string;
  }>({
    isOpen: false,
    applicationId: null,
    applicantName: '',
    department: ''
  });

  // 🚀 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    fetchInitialData(); // 올바른 함수 호출
  }, [fetchInitialData]);

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
      console.log('대시보드 상태 변경:', { applicationId, newStatus });

      // 🚀 면접 상태로 변경하는 경우 일정 설정 필요한지 확인
      if (newStatus === 'interview') {
        const application = getApplicationById(applicationId);
        if (application && application.status === 'submitted') {
          // submitted -> interview 변경 시 일정 설정 모달 표시
          console.log('📅 면접 일정 설정 모달 표시 (드래그앤드롭)');
          setScheduleModal({
            isOpen: true,
            applicationId,
            applicantName: application.name,
            department: selectedJob?.department || ''
          });
          return; // 모달에서 처리하므로 여기서 중단
        }
      }

      // 일반적인 상태 변경 (면접 일정 설정 없음)
      await updateApplicationStatus(applicationId, newStatus as ApplicationStatus);
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  // 📅 면접 일정 설정 완료 핸들러
  const handleScheduleConfirm = async (settings: InterviewSettings) => { // ✨ settings를 인자로 받도록 수정
    try {
      if (!scheduleModal.applicationId) return;

      console.log('📅 대시보드에서 면접 일정 설정 완료:', { ...scheduleModal, settings });
      
      // ✨ updateApplicationStatus 호출 시 settings를 함께 전달
      await updateApplicationStatus(scheduleModal.applicationId, 'interview', settings);
      
      // 모달 닫기
      setScheduleModal({
        isOpen: false,
        applicationId: null,
        applicantName: '',
        department: ''
      });

      console.log('✅ 대시보드 면접 승인 및 일정 설정 완료');
    } catch (error) {
      console.error('면접 승인 실패:', error);
      alert('면접 승인 중 오류가 발생했습니다.');
    }
  };

  const sortOptions = [
    { value: 'latest', label: '최신 순' },
    { value: 'oldest', label: '오래된 순' },
    { value: 'score_desc', label: '평균 높은 순' },
    { value: 'score_asc', label: '평균 낮은 순' },
  ];

  // useMemo를 사용하여 정렬된 컬럼별 데이터를 계산
  const { submittedItems, interviewItems, acceptedItems, finalItems } = useMemo(() => {
    const submitted = getApplicationsByStatus('submitted');
    const interview = getApplicationsByStatus('interview');
    const accepted = getApplicationsByStatus('accepted');
    const final = [
      ...getApplicationsByFinalStatus('hired'),
      ...getApplicationsByFinalStatus('offer_declined'),
    ];

    return {
      submittedItems: sortApplications(submitted, sortOption),
      interviewItems: sortApplications(interview, sortOption),
      acceptedItems: sortApplications(accepted, sortOption),
      finalItems: sortApplications(final, sortOption),
    };
  }, [sortOption, getApplicationsByStatus, getApplicationsByFinalStatus]);

  // 컬럼별로 데이터를 가져와서 각각 정렬하는 것이 올바른 접근
  const getSortedApplicationsByStatus = (status: ApplicationStatus) => {
    const apps = getApplicationsByStatus(status);
    return sortApplications(apps, sortOption);
  };
  
  const getSortedApplicationsByFinalStatus = (finalStatus: FinalStatus) => {
    const apps = getApplicationsByFinalStatus(finalStatus);
    return sortApplications(apps, sortOption);
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
    <>
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
          <div className="flex justify-between items-center mb-4">
            <JobSelector selectedJob={selectedJob} />
            <div className="w-48">
              <CustomDropdown
                options={sortOptions}
                value={sortOption}
                onChange={(val) => setSortOption(val as SortOption)}
              />
            </div>
          </div>
          
          {/* 📋 상태별 지원자 컬럼들 */}
          <DashboardGrid
            submittedItems={submittedItems}
            interviewItems={interviewItems}
            acceptedItems={acceptedItems}
            finalItems={finalItems}
            selectedJob={selectedJob}
            onStatusChange={handleStatusChange}
          />
        </main>
      </div>

      {/* 📅 면접 일정 설정 모달 */}
      <InterviewScheduleModal
        isOpen={scheduleModal.isOpen}
        onClose={() => setScheduleModal({
          isOpen: false,
          applicationId: null,
          applicantName: '',
          department: ''
        })}
        onConfirm={(settings) => handleScheduleConfirm(settings)} // ✨ onConfirm이 settings를 전달하도록 수정
        applicationId={scheduleModal.applicationId || 0}
        department={scheduleModal.department}
        applicantName={scheduleModal.applicantName}
      />
    </>
  );
};

export default Dashboard; 