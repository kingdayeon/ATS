import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Application, Job, ApplicationStatus, FinalStatus } from '../../../../shared/types';
import { useAuthStore } from './authStore';
import type { StoreApi, UseBoundStore } from 'zustand';

export type SortOption = 'latest' | 'name_asc' | 'status_asc';

interface ApplicantState {
  allApplications: Application[];
  jobs: Job[];
  isLoading: boolean;
  error: string | null;

  // Filters
  searchTerm: string;
  selectedJobId: 'all' | number;
  selectedStatuses: (ApplicationStatus | FinalStatus)[];

  // Sorting
  sortOption: SortOption;

  // Actions
  fetchInitialData: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setSelectedJobId: (jobId: 'all' | number) => void;
  toggleStatusFilter: (status: ApplicationStatus | FinalStatus) => void;
  setSortOption: (option: SortOption) => void;

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
  sortOption: 'latest',

  // Actions
  fetchInitialData: async () => {
    set({ isLoading: true });
    try {
      const { data: jobs, error: jobsError } = await supabase.from('jobs').select('*');
      if (jobsError) throw jobsError;

      const { data: applications, error: appsError } = await supabase.from('applications').select('*, jobs(title, department)'); // department 추가
      if (appsError) throw appsError;

      set({ 
        jobs: jobs || [], 
        allApplications: (applications as Application[]) || [], // 원래대로 Application[] 타입 단언
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
    const { allApplications, searchTerm, selectedJobId, selectedStatuses, sortOption } = get();
    const { canAccessJob, user } = useAuthStore.getState();

    let filtered = allApplications;

    // 1. Filter by user permission
    if (user?.role !== 'admin') {
      filtered = filtered.filter(app => app.jobs && canAccessJob(app.jobs.department)); // jobs 존재 여부 확인
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

    // 5. Sort
    switch (sortOption) {
      case 'name_asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'status_asc':
        filtered.sort((a, b) => (a.status + a.final_status).localeCompare(b.status + b.final_status));
        break;
      case 'latest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }
    
    return filtered;
  },
})); 