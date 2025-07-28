import { create } from 'zustand';
import { supabase } from '../../../../shared/lib/supabase';
// import { sendStatusChangeEmail } from '../../../../shared/services/email'; // 이메일 직접 발송 로직은 Edge Function으로 이동했으므로 주석 처리 또는 삭제
import type { Application, Job, ApplicationStatus, FinalStatus } from '../../../../shared/types';
import type { InterviewSettings } from '../services/calendar';
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
  updateApplicationStatus: async (applicationId: number, newStatus: ApplicationStatus, interviewSettings?: InterviewSettings) => {
    try {
      console.log(`🚀 지원자 ${applicationId}의 상태를 변경 시작: ${newStatus}`, interviewSettings ? `(면접 설정 포함)` : '')
      
      // 로딩 상태 시작
      set((state) => ({
        isLoading: true,
        applications: state.applications.map(app =>
          app.id === applicationId
            ? { ...app, status: newStatus }
            : app
        )
      }))

      console.log('📝 로딩 상태 업데이트 완료')

      // 1. DB 상태 업데이트
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', applicationId)

      if (updateError) {
        console.error('❌ DB 상태 업데이트 실패:', updateError)
        throw updateError
      }

      console.log('✅ DB 상태 업데이트 완료')

      // 2. 지원자 정보 조회 (이메일 발송용)
      console.log('👤 지원자 정보 조회 중...')
      const { data: application, error: fetchError } = await supabase
        .from('applications')
        .select(`
          id, name, email,
          jobs:job_id (
            title,
            department
          )
        `)
        .eq('id', applicationId)
        .single()

      if (fetchError || !application) {
        console.error('❌ 지원자 정보 조회 실패:', fetchError)
        throw new Error('지원자 정보를 조회할 수 없습니다.')
      }

      console.log('✅ 지원자 정보 조회 완료:', application)

      // 👤 현재 사용자 세션에서 provider_token 및 이메일 가져오기
      const session = useAuthStore.getState().session;
      const user = useAuthStore.getState().user;
      // 💣 더 이상 사용되지 않음
      // const providerToken = session?.provider_token; 
      const userEmail = user?.email;

      if (newStatus === 'interview' && !userEmail) { // 🔑 토큰 대신 이메일 존재 여부만 체크
        throw new Error('Google 계정 인증 정보(이메일)를 찾을 수 없습니다. 다시 로그인해주세요.');
      }
      
      // 3. 상태 변경 이메일 발송 (Edge Function 호출)
      console.log('📧 상태 변경 이메일 발송 시작...')
      
      // ✨ [변경] 백엔드 함수 시그니처에 맞춰 interviewDetails로 이름 변경
      const bodyPayload = {
        applicantName: application.name,
        applicantEmail: application.email,
        jobTitle: (application.jobs as any)?.title || '',
        company: '무신사',
        newStatus,
        applicationId,
        interviewDetails: interviewSettings, // ✨ 이름 변경 및 전달
      };

      console.log('📤 Edge Function 호출 데이터:', bodyPayload)

      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-status-change-email', {
        body: bodyPayload
      })

      console.log('📨 Edge Function 응답 원본:', { data: emailResult, error: emailError })

      if (emailError) {
        console.error('❌ Edge Function 호출 실패:', emailError)
        console.error('❌ 오류 상세:', JSON.stringify(emailError, null, 2))
        throw new Error(`이메일 발송 실패: ${emailError.message || JSON.stringify(emailError)}`)
      }

      if (!emailResult?.success) {
        console.error('❌ Edge Function 실행 실패:', emailResult)
        console.error('❌ 오류 메시지:', emailResult?.error)
        
                 // 🔍 Edge Function 로그 출력 (실패 시)
         if (emailResult?.logs && Array.isArray(emailResult.logs)) {
           console.log('📋 === Edge Function 상세 로그 (실패) ===')
           emailResult.logs.forEach((log: any, index: number) => {
             console.log(`${index + 1}. ${log}`)
           })
         }
        
        throw new Error(emailResult?.error || '이메일 발송에 실패했습니다.')
      }

      console.log('✅ Edge Function 실행 성공!')
      console.log('📊 응답 상세 (펼치지 않으셔도 됩니다):', emailResult)
      
      // 🔍 Edge Function 로그 데이터 검증
      console.log('🕵️‍♂️ === 로그 데이터 검증 시작 ===');
      console.log('  - `logs` 필드 존재 여부:', emailResult && emailResult.hasOwnProperty('logs'));
      console.log('  - `logs` 필드가 배열인가?:', Array.isArray(emailResult?.logs));
      console.log('  - `logs` 배열 길이:', emailResult?.logs?.length ?? 'N/A');
      console.log('🕵️‍♂️ === 로그 데이터 검증 종료 ===');
      
             // 🔍 Edge Function 로그 출력 (성공 시)
       if (emailResult?.logs && Array.isArray(emailResult.logs)) {
         console.log('📋 === Edge Function 상세 로그 (성공) ===')
         emailResult.logs.forEach((log: any, index: number) => {
           console.log(`${index + 1}. ${log}`)
         })
       }
      
      if (emailResult.details) {
        console.log('📋 처리 결과:')
        console.log(`  - 이메일 발송: ${emailResult.details.emailSent ? '✅' : '❌'}`)
        console.log(`  - Slack 발송: ${emailResult.details.slackSent ? '✅' : '❌'}`)
        console.log(`  - 면접 시간 생성: ${emailResult.details.interviewSlotsGenerated ? '✅' : '❌'}`)
      }

      if (emailResult.schedulingUrl) {
        console.log('🔗 면접 일정 링크:', emailResult.schedulingUrl)
      }

      console.log('🎉 상태 변경 프로세스 완료!')

    } catch (error) {
      console.error('❌ 상태 변경 실패:', error)
      
             // 에러 발생 시 상태 롤백
       const { selectedJobId } = get()
       if (selectedJobId) {
         await get().fetchApplications(selectedJobId)
       }
      
      throw error
    } finally {
      // 로딩 상태 종료
      set({ isLoading: false })
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