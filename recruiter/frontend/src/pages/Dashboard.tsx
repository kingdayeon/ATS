import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Job, Application } from '../../../../shared/types';
import DashboardHeader from '../components/ui/DashboardHeader';
import StatusColumn from '../components/ui/StatusColumn';
import { getDepartmentColor } from '../../../../shared/utils';
import { sendStatusChangeEmail } from '../../../../shared/services/email';

interface ApplicationWithJob extends Application {
  job?: Job;
}

interface DashboardStats {
  submitted: ApplicationWithJob[];
  interview: ApplicationWithJob[];
  accepted: ApplicationWithJob[];
}

const Dashboard = () => {
  const { user, canAccessJob, logout } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardStats>({
    submitted: [],
    interview: [],
    accepted: []
  });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 권한에 따른 채용공고 목록 가져오기
  const fetchJobs = async () => {
    try {
      const { data: allJobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // 권한에 따라 필터링
      const filteredJobs = allJobs?.filter(job => canAccessJob(job.department)) || [];
      setJobs(filteredJobs);
      
      // 첫 번째 채용공고를 기본 선택
      if (filteredJobs.length > 0 && !selectedJobId) {
        setSelectedJobId(filteredJobs[0].id);
      }
    } catch (error) {
      console.error('채용공고 로딩 실패:', error);
    }
  };

  // 선택된 채용공고의 지원자 데이터 가져오기
  const fetchApplicationsForJob = async (jobId: number) => {
    try {
      setIsLoading(true);

      const { data: applications, error } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId);

      if (error) throw error;

      // 상태별로 분류
      const stats: DashboardStats = {
        submitted: applications?.filter(app => app.status === 'submitted') || [],
        interview: applications?.filter(app => app.status === 'interview') || [],
        accepted: applications?.filter(app => app.status === 'accepted') || []
      };

      setDashboardData(stats);
    } catch (error) {
      console.error('지원서 데이터 로딩 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  useEffect(() => {
    if (selectedJobId) {
      fetchApplicationsForJob(selectedJobId);
    }
  }, [selectedJobId]);

  const handleJobChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const jobId = parseInt(event.target.value);
    console.log('Job 변경됨:', jobId);
    setSelectedJobId(jobId);
  };

  const getSelectedJob = () => {
    return jobs.find(job => job.id === selectedJobId);
  };

  const handleApplicationMenuClick = (application: Application) => {
    console.log('메뉴 클릭:', application);
    // TODO: 불합격 처리 등의 메뉴 액션 구현
  };

  // 🎯 상태 변경 핸들러 (드래그앤드롭 & 드롭다운)
  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      console.log(`지원자 ID ${applicationId}의 상태를 ${newStatus}로 변경`);
      
      // 먼저 지원자 정보 가져오기 (이메일 발송용)
      const { data: applicationData, error: fetchError } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            company
          )
        `)
        .eq('id', applicationId)
        .single();

      if (fetchError) {
        console.error('지원자 정보 조회 오류:', fetchError);
        alert('지원자 정보 조회에 실패했습니다.');
        return;
      }
      
      // 상태 업데이트
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) {
        console.error('상태 변경 오류:', error);
        alert('상태 변경에 실패했습니다.');
        return;
      }

      // 성공 시 데이터 새로고침
      await fetchApplicationsForJob(selectedJobId!);
      console.log('✅ 상태 변경 완료!');

      // 📧 이메일 발송 (백그라운드)
      try {
        await sendStatusChangeEmail({
          applicantName: applicationData.name, // ✅ full_name → name 수정
          applicantEmail: applicationData.email,
          jobTitle: applicationData.jobs?.title || '채용공고',
          company: applicationData.jobs?.company || '무신사',
          newStatus: newStatus,
          applicationId: applicationId
        });
        console.log('📧 상태 변경 이메일 발송 완료!');
      } catch (emailError) {
        console.error('⚠️ 이메일 발송 실패 (상태 변경은 완료됨):', emailError);
        // 이메일 발송 실패해도 상태 변경은 완료된 상태이므로 에러로 처리하지 않음
      }
      
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

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

  const selectedJob = getSelectedJob();

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* 헤더 */}
      <DashboardHeader
        user={user!}
        jobs={jobs}
        selectedJobId={selectedJobId}
        onJobChange={handleJobChange}
        onLogout={logout}
      />

      {/* 대시보드 */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-6 w-full flex flex-col min-h-0">
        {selectedJob && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDepartmentColor(selectedJob.department)}`}>
                {selectedJob.department}
              </span>
            </div>
            <p className="text-gray-600">
              {selectedJob.company} · {selectedJob.experience} · {selectedJob.location}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 pb-4">
          <StatusColumn 
            title="지원 접수" 
            items={dashboardData.submitted}
            emptyText="지원자가 없습니다"
            selectedJob={selectedJob}
            onApplicationMenuClick={handleApplicationMenuClick}
            onStatusChange={handleStatusChange}
            statusKey="submitted"
          />
          <StatusColumn 
            title="면접 진행" 
            items={dashboardData.interview}
            emptyText="면접 예정인 지원자가 없습니다"
            selectedJob={selectedJob}
            onApplicationMenuClick={handleApplicationMenuClick}
            onStatusChange={handleStatusChange}
            statusKey="interview"
          />
          <StatusColumn 
            title="입사 제안" 
            items={dashboardData.accepted}
            emptyText="입사 제안한 지원자가 없습니다"
            selectedJob={selectedJob}
            onApplicationMenuClick={handleApplicationMenuClick}
            onStatusChange={handleStatusChange}
            statusKey="accepted"
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 