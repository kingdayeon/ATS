import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ApplicationStatus, Application, Job, InterviewSettings } from '../../../../shared/types';
import { useAuthStore } from '../store/authStore';
import { useDashboardStore } from '../store/dashboardStore';
import { supabase } from '../../../../shared/lib/supabase';


// 분리된 컴포넌트들
import ApplicationHeader from '../components/application/ApplicationHeader';
import ApplicationInfo from '../components/application/ApplicationInfo';
import StatusManagement from '../components/application/StatusManagement';
import EvaluationSection from '../components/application/EvaluationSection'; // 평가 섹션 import
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

  } = useDashboardStore();

  // 로컬 상태 (직접 DB에서 가져온 데이터용)
  const [localApplication, setLocalApplication] = useState<Application | null>(null);
  const [localJob, setLocalJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);

  // 스토어 또는 로컬 상태에서 데이터 가져오기
  const application = id ? getApplicationById(parseInt(id)) || localApplication : null;
  const job = application ? getJobById(application.job_id) || localJob : null;

  // 🔐 권한 체크: 해당 부서 지원서에 접근 권한이 있는지 확인
  const hasAccessPermission = job ? canAccessJob(job.department) : true; // 로딩 중에는 true

  // �� 직접 DB에서 데이터 가져오기 (DB 함수 사용으로 변경)
  const fetchDirectFromDB = async (applicationId: number) => {
    try {
      setIsLoading(true);
      
      // get_applications_for_dashboard 함수를 사용하여 평가 정보 포함
      const { data, error } = await supabase
        .rpc('get_applications_for_dashboard');

      if (error) throw error;

      if (data && data.length > 0) {
        // 특정 지원자 찾기
        const applicationData = data.find((app: any) => app.id === applicationId);
        
        if (applicationData) {
          // jobs 객체를 최상위 레벨로 올겨주어 기존 코드와 호환성 유지
          const processedData = { 
            ...applicationData, 
            jobs: applicationData.jobs 
          }; 
          setLocalApplication(processedData);
          setLocalJob(processedData.jobs);
        } else {
          throw new Error('지원자 정보를 찾을 수 없습니다.');
        }
      } else {
        throw new Error('지원자 정보를 찾을 수 없습니다.');
      }
      
    } catch (error: any) {
      console.error('❌ ApplicationDetail 데이터 로딩 실패:', error);
      setLocalApplication(null);
      setLocalJob(null);
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
      setIsLoading(false);
    } else {
      fetchDirectFromDB(applicationId);
    }
  }, [id, getApplicationById]);

  // 상태 변경 핸들러
  const handleStatusChange = async (newStatus: ApplicationStatus, interviewSettings?: InterviewSettings) => {
    if (!application) return;
    try {
      await updateApplicationStatus(application.id, newStatus, interviewSettings);
      
      // 상태 변경 후 데이터를 다시 불러와서 평가 정보 업데이트
      const applicationId = parseInt(id!);
      await fetchDirectFromDB(applicationId);
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
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

  const showEvaluation = application && (application.status === 'submitted' || application.status === 'interview');

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 헤더 */}
      <div className="flex-shrink-0">
        <ApplicationHeader applicantName={application.name} />
      </div>

      {/* 메인 컨텐츠 그리드 (flex-grow로 남은 공간 채우기) */}
      <main className="flex-1 min-h-0">
        <div className="p-4 sm:p-6 lg:p-8 h-full flex gap-6 xl:gap-8">
          
          {/* 왼쪽 컬럼 (너비 고정) */}
          <div className="w-full max-w-xs flex-shrink-0 space-y-6 overflow-y-auto">
            <ApplicationInfo
              application={application}
              job={job}
            />
            <StatusManagement
              currentStatus={application.status}
              onStatusChange={handleStatusChange}
              applicationId={application.id}
              applicantName={application.name}
              department={job.department}
            />
          </div>

          {/* 중앙 컬럼 (남은 공간 모두 차지) */}
          <div className="flex-1 min-w-0 overflow-y-auto rounded-lg">
            <PDFViewer application={application} />
          </div>
          
          {/* 오른쪽 컬럼 (평가하기) - 조건부 렌더링 및 너비 고정 */}
          {showEvaluation && (
            <div className="w-full max-w-sm flex-shrink-0 space-y-6 overflow-y-auto">
              <EvaluationSection applicationStatus={application.status} />
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
};

export default ApplicationDetail; 