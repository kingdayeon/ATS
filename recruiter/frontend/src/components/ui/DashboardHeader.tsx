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
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">무신사 ATS</h1>
            </div>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {user.name} · {user.role === 'admin' ? '채용담당자' : user.role === 'manager' ? '팀장' : '팀원'}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
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
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader; 