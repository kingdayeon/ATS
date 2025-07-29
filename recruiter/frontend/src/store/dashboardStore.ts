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

export type SortOption = 
  | 'latest' 
  | 'oldest' 
  | 'document_score_desc' 
  | 'document_score_asc'
  | 'interview_score_desc'
  | 'interview_score_asc'
  | 'total_score_desc'
  | 'total_score_asc';

interface DashboardState {
  // 데이터
  jobs: Job[];
  applications: Application[];
  selectedJobId: number | null;
  
  // UI 상태
  isLoading: boolean;
  error: string | null;
  
  // 데이터 로딩
  fetchInitialData: () => Promise<void>;
  setSelectedJob: (jobId: number | null) => void;
  getApplicationsByStatus: (status: ApplicationStatus) => Application[];
  getApplicationsByFinalStatus: (finalStatus: FinalStatus) => Application[];
  getApplicationById: (id: number) => Application | null;
  getJobById: (id: number) => Job | null;
  
  // 상태 변경
  updateApplicationStatus: (applicationId: number, newStatus: ApplicationStatus, interviewSettings?: InterviewSettings) => Promise<void>;
  
  // 유틸리티
  updateApplicationEvaluation: (applicationId: number, userId: number, newScore: number, evaluationStage?: string) => void;
  

  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // 초기 상태
  jobs: [],
  applications: [],
  selectedJobId: null,
  isLoading: false,
  error: null,
  sortOption: 'latest',

  setSortOption: (option: SortOption) => set({ sortOption: option }),

  // 채용공고 목록 가져오기
  fetchInitialData: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true);
      if (jobsError) throw jobsError;

      const { data: applications, error: applicationsError } = await supabase
        .rpc('get_applications_for_dashboard');
        
      if (applicationsError) throw applicationsError;

      set({ 
        jobs: jobs || [], 
        applications: (applications as Application[]) || [],
        isLoading: false,
        sortOption: 'latest'
      });
      
    } catch (error: any) {
      console.error('초기 데이터 로딩 실패:', error);
      set({ error: '데이터를 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  // 채용공고 선택
  setSelectedJob: (jobId: number | null) => {
    set({ selectedJobId: jobId });
  },

  // 상태별 지원자 필터링
  getApplicationsByStatus: (status: ApplicationStatus) => {
    const { applications, selectedJobId } = get();
    
    // selectedJobId가 null이면 모든 지원자를 반환
    if (!selectedJobId) {
      return applications.filter(app => 
        app.status === status && app.final_status === 'pending'
      );
    }
    return applications.filter(app => 
      app.job_id === selectedJobId && app.status === status && app.final_status === 'pending'
    );
  },

  // 최종 상태별 지원자 필터링
  getApplicationsByFinalStatus: (finalStatus: FinalStatus) => {
    const { applications, selectedJobId } = get();
    // selectedJobId가 null이면 모든 지원자를 반환
    if (!selectedJobId) {
      return applications.filter(app => 
        app.final_status === finalStatus
      );
    }
    return applications.filter(app => 
      app.job_id === selectedJobId && app.final_status === finalStatus
    );
  },

  // 지원자 ID로 찾기
  getApplicationById: (id: number) => {
    const { applications } = get();
    return applications.find(app => app.id === id) || null;
  },

  // 채용공고 ID로 찾기
  getJobById: (id: number) => {
    const { jobs } = get();
    return jobs.find(job => job.id === id) || null;
  },

  // 지원서 상태 변경
  updateApplicationStatus: async (applicationId, newStatus, interviewSettings) => {
    const originalApplications = get().applications;
    
    // UI 즉시 업데이트 (로딩 상태 없이)
    set(state => ({
      applications: state.applications.map(app =>
        app.id === applicationId
          ? { ...app, status: newStatus, final_status: newStatus === 'rejected' ? 'rejected' : app.final_status }
          : app
      ),
    }));

    try {
      let updatePayload: Partial<Application> = { status: newStatus };

      if (newStatus === 'rejected') {
        updatePayload = { final_status: 'rejected', status: 'rejected' };
      }

      const { data: updatedApplication, error: updateError } = await supabase
        .from('applications')
        .update(updatePayload)
        .eq('id', applicationId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // DB의 최종 결과로 상태를 업데이트
      set(state => ({
        applications: state.applications.map(app => 
          app.id === updatedApplication.id ? updatedApplication : app
        ),
      }));

      // 상태 변경 후 대시보드 데이터를 다시 불러와서 평가 정보 업데이트
      const { data: freshData, error: refreshError } = await supabase.rpc('get_applications_for_dashboard');
      if (!refreshError && freshData) {
        set(state => ({
          applications: freshData.map((app: any) => ({
            ...app,
            jobs: app.jobs ? (typeof app.jobs === 'string' ? JSON.parse(app.jobs) : app.jobs) : null
          }))
        }));
      }

      // 이메일 발송을 백그라운드로 처리 (UI 블로킹 없음)
      if (newStatus !== 'rejected') {
        // 백그라운드에서 이메일 발송
        (async () => {
          try {
            const { data: application, error: fetchError } = await supabase
              .from('applications')
              .select('id, name, email, jobs:job_id(title, department)')
              .eq('id', applicationId)
              .single();
            
            if (fetchError || !application) {
              console.error('이메일 발송용 지원자 정보 조회 실패:', fetchError);
              return;
            }

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
          } catch (emailError) {
            console.error('백그라운드 이메일 발송 실패:', emailError);
            // 이메일 발송 실패는 UI에 영향을 주지 않음
          }
        })();
      }
    } catch (error) {
      console.error('상태 변경 실패, 원래 상태로 롤백:', error);
      set({ applications: originalApplications });
      throw error;
    }
  },





  // 평가 등록 시 대시보드 데이터를 실시간으로 업데이트하는 함수
  updateApplicationEvaluation: (applicationId, userId, newScore, evaluationStage = 'document') => {
    set(state => ({
      applications: state.applications.map(app => {
        if (app.id === applicationId) {
          if (evaluationStage === 'document') {
            // 서류 평가 업데이트
            const newDocumentEvaluatorIds = [...(app.document_evaluator_ids || []), userId];
            const currentDocumentTotalScore = (app.document_average_score || 0) * (app.document_evaluation_count || 0);
            const newDocumentEvaluationCount = (app.document_evaluation_count || 0) + 1;
            const newDocumentAverageScore = (currentDocumentTotalScore + newScore) / newDocumentEvaluationCount;

            return {
              ...app,
              document_evaluator_ids: newDocumentEvaluatorIds,
              document_average_score: newDocumentAverageScore,
              document_evaluation_count: newDocumentEvaluationCount,
              // 하위 호환성을 위해 기존 필드도 업데이트
              evaluator_ids: newDocumentEvaluatorIds,
              average_score: newDocumentAverageScore,
              evaluation_count: newDocumentEvaluationCount,
            };
          } else {
            // 면접 평가 업데이트
            const newInterviewEvaluatorIds = [...(app.interview_evaluator_ids || []), userId];
            const currentInterviewTotalScore = (app.interview_average_score || 0) * (app.interview_evaluation_count || 0);
            const newInterviewEvaluationCount = (app.interview_evaluation_count || 0) + 1;
            const newInterviewAverageScore = (currentInterviewTotalScore + newScore) / newInterviewEvaluationCount;

            return {
              ...app,
              interview_evaluator_ids: newInterviewEvaluatorIds,
              interview_average_score: newInterviewAverageScore,
              interview_evaluation_count: newInterviewEvaluationCount,
              // 하위 호환성을 위해 기존 필드도 업데이트
              evaluator_ids: newInterviewEvaluatorIds,
              average_score: newInterviewAverageScore,
              evaluation_count: newInterviewEvaluationCount,
            };
          }
        }
        return app;
      }),
    }));
  },
})); 