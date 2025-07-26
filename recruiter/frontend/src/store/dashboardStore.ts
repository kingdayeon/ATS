import { create } from 'zustand';
import { supabase } from '../../../../shared/lib/supabase';
import { sendStatusChangeEmail } from '../../../../shared/services/email';
import type { Application, Job, ApplicationStatus } from '../../../../shared/types';

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
  getApplicationById: (id: number) => Application | null;
  getJobById: (id: number) => Job | null;
  
  // 📝 액션 - 상태 변경
  updateApplicationStatus: (applicationId: number, newStatus: ApplicationStatus) => Promise<void>;
  
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
      
      // 첫 번째 채용공고를 기본 선택 (selectedJobId가 없을 때만)
      const { selectedJobId } = get();
      if (allJobs && allJobs.length > 0 && !selectedJobId) {
        set({ selectedJobId: allJobs[0].id });
      }
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
        .select('*')
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
    return applications.filter(app => app.status === status);
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

  // ⚡ 지원자 상태 변경 (이메일 알림 포함)
  updateApplicationStatus: async (applicationId: number, newStatus: ApplicationStatus) => {
    try {
      set({ isLoading: true, error: null });

      // 🔍 현재 지원자 데이터 찾기
      const { applications, getJobById } = get();
      const application = applications.find(app => app.id === applicationId);
      
      if (!application) {
        throw new Error('지원자를 찾을 수 없습니다.');
      }

      const job = getJobById(application.job_id);
      if (!job) {
        throw new Error('채용공고를 찾을 수 없습니다.');
      }

      // 🔄 데이터베이스 업데이트
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId);

      if (error) throw error;

      // ✅ 로컬 상태 즉시 업데이트 (성능 최적화)
      const updatedApplications = applications.map(app =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      );
      set({ applications: updatedApplications, isLoading: false });

      // 📧 이메일 발송 (백그라운드, 실패해도 UI 변경은 유지)
      try {
        await sendStatusChangeEmail({
          applicantName: application.name,
          applicantEmail: application.email,
          jobTitle: job.title,
          company: job.company,
          newStatus: newStatus,
          applicationId: applicationId
        });
        console.log('📧 상태 변경 이메일 발송 완료!');
      } catch (emailError) {
        console.error('⚠️ 이메일 발송 실패 (상태 변경은 완료됨):', emailError);
      }

      console.log(`✅ 지원자 ${application.name}의 상태가 ${newStatus}로 변경되었습니다.`);
      
    } catch (error) {
      console.error('상태 변경 실패:', error);
      set({ 
        error: '상태 변경 중 오류가 발생했습니다.', 
        isLoading: false 
      });
      throw error; // 컴포넌트에서 에러 처리할 수 있도록
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