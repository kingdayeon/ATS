import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ApplicationStatus, Application, Job } from '../../../../shared/types';
import { useAuthStore } from '../store/authStore';
import { useDashboardStore } from '../store/dashboardStore';
import { supabase } from '../../../../shared/lib/supabase';
import type { InterviewSettings } from '../services/calendar';

// 분리된 컴포넌트들
import ApplicationHeader from '../components/application/ApplicationHeader';
import ApplicationInfo from '../components/application/ApplicationInfo';
import StatusManagement from '../components/application/StatusManagement';
import PDFViewer from '../components/application/PDFViewer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import InterviewScheduleModal from '../components/interview/InterviewScheduleModal';

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canAccessJob } = useAuthStore();
  const {
    getApplicationById,
    getJobById,
    updateApplicationStatus,
    getStatusText,
    getStatusColor
  } = useDashboardStore();

  // 로컬 상태 (직접 DB에서 가져온 데이터용)
  const [localApplication, setLocalApplication] = useState<Application | null>(null);
  const [localJob, setLocalJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);

  // 스토어 또는 로컬 상태에서 데이터 가져오기
  const application = id ? getApplicationById(parseInt(id)) || localApplication : null;
  const job = application ? getJobById(application.job_id) || localJob : null;

  // 🔐 권한 체크: 해당 부서 지원서에 접근 권한이 있는지 확인
  const hasAccessPermission = job ? canAccessJob(job.department) : true; // 로딩 중에는 true

  // 🚀 직접 DB에서 데이터 가져오기 (스토어에 없을 때)
  const fetchDirectFromDB = async (applicationId: number) => {
    try {
      setIsLoading(true);
      console.log(`🔍 ApplicationDetail: 직접 DB에서 지원서 ${applicationId} 조회`);

      // 지원서 정보 가져오기
      const { data: applicationData, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError) throw appError;

      console.log(`✅ 지원서 조회 성공: ${applicationData.name}`);
      setLocalApplication(applicationData);

      // 채용공고 정보 가져오기
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', applicationData.job_id)
        .single();

      if (jobError) throw jobError;

      console.log(`✅ 채용공고 조회 성공: ${jobData.title}`);
      setLocalJob(jobData);

      // 🔐 권한 체크: 데이터 로드 후 즉시 권한 확인
      if (!canAccessJob(jobData.department)) {
        console.log(`🚫 접근 권한 없음: ${jobData.department} 부서`);
      }

    } catch (error) {
      console.error('❌ ApplicationDetail 데이터 로딩 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🚀 컴포넌트 마운트 시 데이터 확인 및 로딩
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    const applicationId = parseInt(id);
    const storeApplication = getApplicationById(applicationId);

    if (storeApplication) {
      // 스토어에 데이터가 있으면 사용
      console.log(`✅ ApplicationDetail: 스토어에서 지원서 발견 - ${storeApplication.name}`);
      setIsLoading(false);
    } else {
      // 스토어에 없으면 직접 DB에서 가져오기
      console.log(`🔍 ApplicationDetail: 스토어에 지원서 없음, 직접 DB 조회 - ID ${applicationId}`);
      fetchDirectFromDB(applicationId);
    }
  }, [id, getApplicationById]);

  // ⚡ 상태 변경 핸들러 (면접 일정 설정 포함)
  const handleStatusChange = async (newStatus: Application['status']) => {
    if (newStatus === 'interview') {
      setScheduleModalOpen(true);
    } else {
    if (!application) return;
    try {
        console.log('상태 변경 시작:', { newStatus });
        await updateApplicationStatus(application.id, newStatus);
      console.log('✅ 상태 변경 완료!');
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
      }
    }
  };

  const handleScheduleConfirm = async () => {
    if (!application) return;
    try {
      console.log('면접 일정 확정 시작');
      await updateApplicationStatus(application.id, 'interview');
      setScheduleModalOpen(false);
      console.log('✅ 면접 일정 확정 완료!');
    } catch (error) {
      console.error('면접 일정 확정 실패:', error);
      alert('면접 일정 확정에 실패했습니다.');
    }
  };

  // 🔄 로딩 중
  if (isLoading) {
    return <LoadingSpinner message="지원서 로딩 중..." />;
  }

  // 🔄 데이터 없음
  if (!application || !job) {
    return (
      <ErrorDisplay 
        message="지원서를 찾을 수 없습니다." 
        onRetry={() => navigate('/dashboard')}
        retryText="대시보드로 돌아가기"
      />
    );
  }

  // 🔐 권한 없음
  if (!hasAccessPermission) {
    return (
      <ErrorDisplay 
        message={`${job.department} 부서 지원서에 대한 접근 권한이 없습니다.`}
        onRetry={() => navigate('/dashboard')}
        retryText="대시보드로 돌아가기"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <ApplicationHeader applicantName={application.name} />

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8">
        {/* 왼쪽: 지원자 정보 + 상태 관리 */}
        <div className="md:col-span-1 space-y-6">
          <ApplicationInfo
            application={application}
            job={job}
            getStatusText={getStatusText}
            getStatusColor={getStatusColor}
          />
        </div>

        {/* 오른쪽: PDF 뷰어 */}
        <div className="xl:col-span-2">
          <PDFViewer application={application} />
        </div>
      </div>
      {isScheduleModalOpen && (
        <InterviewScheduleModal 
          isOpen={isScheduleModalOpen}
          onClose={() => setScheduleModalOpen(false)}
          onConfirm={handleScheduleConfirm}
          applicationId={application.id}
          applicantName={application.name}
          department={job.department}
        />
      )}
    </div>
  );
};

export default ApplicationDetail; 