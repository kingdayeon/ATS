import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Job, Application, JobWithStats } from '../../../../shared/types';

interface DashboardStats {
  submitted: JobWithStats[];
  reviewing: JobWithStats[];
  interview: JobWithStats[];
  approved: JobWithStats[];
}

const Dashboard = () => {
  const { user, canAccessJob, logout } = useAuthStore();
  const [dashboardData, setDashboardData] = useState<DashboardStats>({
    submitted: [],
    reviewing: [],
    interview: [],
    approved: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('전체');

  // 권한별 필터 옵션
  const getFilterOptions = () => {
    if (!user) return ['전체'];
    
    if (user.role === 'admin') {
      return ['전체', 'Backend Engineer', 'Frontend Engineer', 'Mobile Engineer', 'Design', 'Product Designer'];
    }
    
    if (user.department === 'dev') {
      return ['전체', 'Backend Engineer', 'Frontend Engineer', 'Mobile Engineer', 'Engineering Manager'];
    }
    
    if (user.department === 'design') {
      return ['전체', 'Design', 'Product Designer'];
    }
    
    return ['전체'];
  };

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // 1. 모든 채용공고 가져오기
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true);

      if (jobsError) throw jobsError;

      // 2. 모든 지원서 가져오기
      const { data: applications, error: applicationsError } = await supabase
        .from('applications')
        .select('*');

      if (applicationsError) throw applicationsError;

      // 3. 권한에 따라 필터링된 채용공고만 처리
      const filteredJobs = jobs?.filter(job => canAccessJob(job.department)) || [];
      
      // 4. 선택된 필터 적용
      const finalJobs = selectedFilter === '전체' 
        ? filteredJobs 
        : filteredJobs.filter(job => job.department === selectedFilter);

      // 5. 채용공고별 지원자 데이터 조합
      const jobsWithStats: JobWithStats[] = finalJobs.map(job => {
        const jobApplications = applications?.filter(app => app.job_id === job.id) || [];
        return {
          job,
          applicationCount: jobApplications.length,
          applications: jobApplications
        };
      });

      // 6. 상태별로 분류
      const stats: DashboardStats = {
        submitted: [],
        reviewing: [],
        interview: [],
        approved: []
      };

      jobsWithStats.forEach(jobWithStats => {
        const { applications } = jobWithStats;
        
        // 각 상태별 지원자가 있는 채용공고만 해당 컬럼에 추가
        const submittedApps = applications.filter(app => app.status === 'submitted');
        const reviewingApps = applications.filter(app => app.status === 'reviewing');
        const interviewApps = applications.filter(app => app.status === 'interview');
        const approvedApps = applications.filter(app => app.status === 'accepted');

        if (submittedApps.length > 0) {
          stats.submitted.push({
            ...jobWithStats,
            applications: submittedApps,
            applicationCount: submittedApps.length
          });
        }

        if (reviewingApps.length > 0) {
          stats.reviewing.push({
            ...jobWithStats,
            applications: reviewingApps,
            applicationCount: reviewingApps.length
          });
        }

        if (interviewApps.length > 0) {
          stats.interview.push({
            ...jobWithStats,
            applications: interviewApps,
            applicationCount: interviewApps.length
          });
        }

        if (approvedApps.length > 0) {
          stats.approved.push({
            ...jobWithStats,
            applications: approvedApps,
            applicationCount: approvedApps.length
          });
        }
      });

      setDashboardData(stats);
    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, selectedFilter]);

  const StatusColumn = ({ title, items, emptyText }: { 
    title: string; 
    items: JobWithStats[]; 
    emptyText: string;
  }) => (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={`${item.job.id}-${title}`} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 text-sm leading-tight">
                  {item.job.title}
                </h4>
                <button className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              
              <div className="text-xs text-gray-500 mb-3">
                {item.job.department} • {item.job.company}
              </div>
              
              <div className="text-xs text-gray-600">
                지원자 {item.applicationCount}명
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {emptyText}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">무신사 ATS</h1>
              <div className="ml-4 text-sm text-gray-500">
                {user?.name} ({user?.role === 'admin' ? '채용담당자' : user?.role === 'manager' ? '팀장' : '팀원'})
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select 
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-black"
              >
                {getFilterOptions().map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 대시보드 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatusColumn 
            title="지원 접수" 
            items={dashboardData.submitted}
            emptyText="지원자 없음"
          />
          <StatusColumn 
            title="서류 검토" 
            items={dashboardData.reviewing}
            emptyText="지원자 없음"
          />
          <StatusColumn 
            title="면접 진행" 
            items={dashboardData.interview}
            emptyText="지원자 없음"
          />
          <StatusColumn 
            title="인사 검토" 
            items={dashboardData.approved}
            emptyText="지원자 없음"
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 