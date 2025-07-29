import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Application, Job, ApplicationStatus, FinalStatus } from '../../../../shared/types';
import { useAuthStore } from './authStore';
import type { StoreApi, UseBoundStore } from 'zustand';

export type SortOption = 
  | 'latest' 
  | 'oldest' 
  | 'name_asc' 
  | 'status_asc' 
  | 'document_score_desc' 
  | 'document_score_asc'
  | 'interview_score_desc'
  | 'interview_score_asc'
  | 'total_score_desc'
  | 'total_score_asc';

interface ApplicantState {
  allApplications: Application[];
  jobs: Job[];
  isLoading: boolean;
  error: string | null;

  // Filters
  searchTerm: string;
  selectedJobId: 'all' | number;
  selectedStatuses: (ApplicationStatus | FinalStatus)[];
  filterMyUnevaluated: boolean;

  // Sorting
  sortOption: SortOption;

  // Actions
  fetchInitialData: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setSelectedJobId: (jobId: 'all' | number) => void;
  toggleStatusFilter: (status: ApplicationStatus | FinalStatus) => void;
  setSortOption: (option: SortOption) => void;
  toggleMyUnevaluatedFilter: () => void;

  // Getters (Selectors)
  filteredApplications: () => Application[];
  getJobTitleById: (jobId: number) => string;
  getAvailableJobs: () => Job[];
}

export const useApplicantStore: UseBoundStore<StoreApi<ApplicantState>> = create<ApplicantState>((set, get) => ({
  // Initial State
  allApplications: [],
  jobs: [],
  isLoading: true,
  error: null,
  searchTerm: '',
  selectedJobId: 'all',
  selectedStatuses: [],
  filterMyUnevaluated: false,
  sortOption: 'latest',

  // Actions
  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const { data: jobs, error: jobsError } = await supabase.from('jobs').select('*');
      if (jobsError) throw jobsError;

      // 💣 [버그 수정] 기본 테이블 대신, 평가 정보가 포함된 DB 함수를 호출하도록 수정
      const { data: applications, error: appsError } = await supabase.rpc('get_applications_for_dashboard');
      if (appsError) throw appsError;

      set({ 
        jobs: jobs || [], 
        allApplications: (applications as Application[]) || [], 
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedJobId: (jobId) => set({ selectedJobId: jobId }),
  toggleStatusFilter: (status) => {
    set((state) => {
      const currentStatuses = state.selectedStatuses;
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status];
      return { selectedStatuses: newStatuses };
    });
  },
  setSortOption: (option) => set({ sortOption: option }),
  toggleMyUnevaluatedFilter: () => set(state => ({ filterMyUnevaluated: !state.filterMyUnevaluated })),

  // Getters
  getJobTitleById: (jobId) => {
    const job = get().jobs.find(j => j.id === jobId);
    return job?.title || 'N/A';
  },

  getAvailableJobs: () => {
    const { jobs } = get();
    const { canAccessJob, user } = useAuthStore.getState();
    if (user?.role === 'admin') {
      return jobs;
    }
    return jobs.filter(job => canAccessJob(job.department));
  },

  filteredApplications: () => {
    const { allApplications, searchTerm, selectedJobId, selectedStatuses, sortOption, filterMyUnevaluated } = get();
    const { canAccessJob, user } = useAuthStore.getState(); // canAccessJob 다시 추가

    let filtered = allApplications;

    // 1. Filter by user permission
    if (user?.role !== 'admin') {
      filtered = filtered.filter(app => app.jobs && canAccessJob(app.jobs.department));
    }

    // 2. Filter by selected job
    if (selectedJobId !== 'all') {
      filtered = filtered.filter(app => app.job_id === selectedJobId);
    }
    
    // 3. Filter by search term (name)
    if (searchTerm) {
      filtered = filtered.filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // 4. Filter by statuses
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(app => {
        // final_status가 결정된 경우, final_status를 기준으로 필터링
        if (app.final_status !== 'pending') {
          return selectedStatuses.includes(app.final_status);
        }
        // 그렇지 않으면, 기존 status를 기준으로 필터링
        return selectedStatuses.includes(app.status);
      });
    }

    // '내가 미평가' 필터링
    if (filterMyUnevaluated && user) {
      filtered = filtered.filter(app => !app.evaluator_ids || !app.evaluator_ids.includes(user.id));
    }
    
    // 5. Sort
    switch (sortOption) {
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'status_asc':
        filtered.sort((a, b) => (a.status + a.final_status).localeCompare(b.status + b.final_status));
        break;
      
      // 서류 평균 정렬 (점수가 없는 경우 뒤로)
      case 'document_score_desc':
        filtered.sort((a, b) => {
          const aScore = a.document_average_score;
          const bScore = b.document_average_score;
          if (aScore == null && bScore == null) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          if (aScore == null) return 1;
          if (bScore == null) return -1;
          return bScore - aScore;
        });
        break;
      case 'document_score_asc':
        filtered.sort((a, b) => {
          const aScore = a.document_average_score;
          const bScore = b.document_average_score;
          if (aScore == null && bScore == null) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          if (aScore == null) return 1;
          if (bScore == null) return -1;
          return aScore - bScore;
        });
        break;
      
      // 면접 평균 정렬 (면접 점수가 없는 경우 뒤로)
      case 'interview_score_desc':
        filtered.sort((a, b) => {
          const aScore = a.interview_average_score;
          const bScore = b.interview_average_score;
          if (aScore == null && bScore == null) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          if (aScore == null) return 1;
          if (bScore == null) return -1;
          return bScore - aScore;
        });
        break;
      case 'interview_score_asc':
        filtered.sort((a, b) => {
          const aScore = a.interview_average_score;
          const bScore = b.interview_average_score;
          if (aScore == null && bScore == null) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          if (aScore == null) return 1;
          if (bScore == null) return -1;
          return aScore - bScore;
        });
        break;
      
      // 총 평균 정렬 (총 평균이 없는 경우 뒤로)
      case 'total_score_desc':
        filtered.sort((a, b) => {
          const aTotalScore = (a.document_average_score != null && a.interview_average_score != null) 
            ? (a.document_average_score + a.interview_average_score) / 2 : null;
          const bTotalScore = (b.document_average_score != null && b.interview_average_score != null) 
            ? (b.document_average_score + b.interview_average_score) / 2 : null;
          if (aTotalScore == null && bTotalScore == null) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          if (aTotalScore == null) return 1;
          if (bTotalScore == null) return -1;
          return bTotalScore - aTotalScore;
        });
        break;
      case 'total_score_asc':
        filtered.sort((a, b) => {
          const aTotalScore = (a.document_average_score != null && a.interview_average_score != null) 
            ? (a.document_average_score + a.interview_average_score) / 2 : null;
          const bTotalScore = (b.document_average_score != null && b.interview_average_score != null) 
            ? (b.document_average_score + b.interview_average_score) / 2 : null;
          if (aTotalScore == null && bTotalScore == null) return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          if (aTotalScore == null) return 1;
          if (bTotalScore == null) return -1;
          return aTotalScore - bTotalScore;
        });
        break;
      
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'latest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    
    return filtered;
  },
})); 