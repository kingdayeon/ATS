import { Link } from 'react-router-dom';
import type { Job, User } from '../../../../../shared/types';

interface DashboardHeaderProps {
  user: User;
  jobs: Job[];
  selectedJobId: number | null;
  onJobChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onLogout: () => void;
}

const DashboardHeader = ({ 
  user, 
  jobs, 
  selectedJobId, 
  onJobChange, 
  onLogout 
}: DashboardHeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* 데스크톱: 가로 배치 */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">무신사 ATS</h1>
            </div>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
              {user.name} · {user.role === 'admin' ? '채용담당자' : user.role === 'manager' ? '팀장' : '팀원'}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              to="/applicants"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              모든 지원자 보기
            </Link>

            <select 
              value={selectedJobId || ''}
              onChange={onJobChange}
              className="text-sm border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black focus:border-black min-w-[280px] bg-white"
            >
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            
            <button
              onClick={onLogout}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 whitespace-nowrap"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 📱 모바일/태블릿: 세로 스택 */}
        <div className="lg:hidden space-y-4">
          {/* 로고 + 제목 (가로 유지) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">무신사 ATS</h1>
            </div>
            <button
              onClick={onLogout}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              로그아웃
            </button>
          </div>

          {/* 사용자 정보 */}
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
              {user.name} · {user.role === 'admin' ? '채용담당자' : user.role === 'manager' ? '팀장' : '팀원'}
            </div>
          </div>

          {/* 채용공고 선택 */}
          <select 
            value={selectedJobId || ''}
            onChange={onJobChange}
            className="w-full text-sm border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white"
          >
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader; 