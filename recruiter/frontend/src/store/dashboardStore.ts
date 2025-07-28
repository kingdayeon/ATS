import { create } from 'zustand';
import { supabase } from '../../../../shared/lib/supabase';
// import { sendStatusChangeEmail } from '../../../../shared/services/email'; // 이메일 직접 발송 로직은 Edge Function으로 이동했으므로 주석 처리 또는 삭제
import type {
  ApplicationStatus,
  Application,
  Job,
  FinalStatus, // 추가
  InterviewSettings, // shared/types에서 직접 가져오기
} from '../../../../shared/types';
import { useAuthStore } from './authStore';

interface DashboardState {
  // 📊 데이터
  jobs: Job[];
  applications: Application[];
  selectedJobId: number | null;
  
  // 🔄 UI 상태
  isLoading: boolean;
  error: string | null;
  
  // 📝 액션 - 데이터 로딩
  fetchJobs: () => Promise<void>;
  fetchApplications: (jobId: number) => Promise<void>;
  
  // 📝 액션 - 선택/필터링
  setSelectedJob: (jobId: number) => void;
  getApplicationsByStatus: (status: ApplicationStatus) => Application[];
  getApplicationsByFinalStatus: (finalStatus: FinalStatus) => Application[];
  getApplicationById: (id: number) => Application | null;
  getJobById: (id: number) => Job | null;
  
  // 📝 액션 - 상태 변경
  updateApplicationStatus: (applicationId: number, newStatus: ApplicationStatus, interviewSettings?: InterviewSettings) => Promise<void>;
  
  // 📝 유틸리티
  getStatusText: (status: ApplicationStatus) => string;
  getStatusColor: (status: ApplicationStatus) => string;
  
  // 🧹 초기화
  reset: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // 초기 상태
  jobs: [],
  applications: [],
  selectedJobId: null,
  isLoading: false,
  error: null,

  // 📊 채용공고 목록 가져오기
  fetchJobs: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data: allJobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      set({ jobs: allJobs || [], isLoading: false });
      
    } catch (error) {
      console.error('채용공고 로딩 실패:', error);
      set({ error: '채용공고를 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  // 📊 지원자 데이터 가져오기
  fetchApplications: async (jobId: number) => {
    try {
      set({ isLoading: true, error: null });

      const { data: applications, error } = await supabase
        .from('applications')
        .select('*') // 'final_status'를 포함한 모든 컬럼을 가져옴
        .eq('job_id', jobId);

      if (error) throw error;

      set({ applications: applications || [], isLoading: false });
    } catch (error) {
      console.error('지원서 데이터 로딩 실패:', error);
      set({ error: '지원서 데이터를 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  // 🎯 채용공고 선택
  setSelectedJob: (jobId: number) => {
    set({ selectedJobId: jobId });
    get().fetchApplications(jobId);
  },

  // 🔍 상태별 지원자 필터링
  getApplicationsByStatus: (status: ApplicationStatus) => {
    const { applications } = get();
    // '최종 결과'가 결정된 지원자는 기존 칸반 보드에 나타나지 않도록 필터링
    return applications.filter(app => app.status === status && app.final_status === 'pending');
  },

  // 🚀 추가: 최종 결정된 지원자를 필터링하는 getter
  getApplicationsByFinalStatus: (finalStatus: FinalStatus) => {
    const { applications } = get();
    return applications.filter(app => app.final_status === finalStatus);
  },

  // 🔍 지원자 ID로 찾기
  getApplicationById: (id: number) => {
    const { applications } = get();
    return applications.find(app => app.id === id) || null;
  },

  // 🔍 채용공고 ID로 찾기
  getJobById: (id: number) => {
    const { jobs } = get();
    return jobs.find(job => job.id === id) || null;
  },

  // 🔄 지원서 상태 변경
  updateApplicationStatus: async (applicationId, newStatus, interviewSettings) => {
    // 로딩 상태 시작 (즉시 UI 반영)
    const originalApplications = get().applications;
    set(state => ({
      isLoading: true,
      applications: state.applications.map(app =>
        app.id === applicationId
          ? { ...app, status: newStatus, final_status: newStatus === 'rejected' ? 'rejected' : app.final_status }
          : app
      ),
    }));

    try {
      let updatePayload: Partial<Application> = { status: newStatus };

      if (newStatus === 'rejected') {
        updatePayload = { final_status: 'rejected', status: 'rejected' }; // status도 함께 업데이트하여 일관성 유지
      }

      const { data: updatedApplication, error: updateError } = await supabase
        .from('applications')
        .update(updatePayload)
        .eq('id', applicationId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // DB의 최종 결과로 상태를 다시 한번 업데이트하여 정합성 보장
      set(state => ({
        applications: state.applications.map(app => 
          app.id === updatedApplication.id ? updatedApplication : app
        ),
      }));

      // 'rejected'가 아닌 경우에만 이메일 발송
      if (newStatus !== 'rejected') {
        const { data: application, error: fetchError } = await supabase
          .from('applications')
          .select('id, name, email, jobs:job_id(title, department)')
          .eq('id', applicationId)
          .single();
        if (fetchError || !application) throw new Error('지원자 정보 조회 실패');

        await supabase.functions.invoke('send-status-change-email', {
          body: {
            applicantName: application.name,
            applicantEmail: application.email,
            jobTitle: (application.jobs as any)?.title || '',
            company: '무신사',
            newStatus,
            applicationId,
            interviewDetails: interviewSettings,
          },
        });
      }
    } catch (error) {
      console.error('상태 변경 실패, 원래 상태로 롤백:', error);
      set({ applications: originalApplications }); // 에러 발생 시 원래 상태로 롤백
      throw error;
    } finally {
      set({ isLoading: false }); // 성공/실패 여부와 관계없이 로딩 상태 종료
    }
  },

  // 🎨 상태 텍스트 변환
  getStatusText: (status: ApplicationStatus): string => {
    const statusMap: Record<ApplicationStatus, string> = {
      'submitted': '지원 접수',
      'interview': '면접 진행',
      'accepted': '입사 제안',
      'rejected': '불합격'
    };
    return statusMap[status] || status;
  },

  // 🎨 상태 색상 클래스
  getStatusColor: (status: ApplicationStatus): string => {
    const colors: Record<ApplicationStatus, string> = {
      'submitted': 'bg-blue-100 text-blue-700 border-blue-200',
      'interview': 'bg-purple-100 text-purple-700 border-purple-200',
      'accepted': 'bg-green-100 text-green-700 border-green-200',
      'rejected': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  },

  // 🧹 스토어 초기화
  reset: () => {
    set({
      jobs: [],
      applications: [],
      selectedJobId: null,
      isLoading: false,
      error: null
    });
  }
})); 