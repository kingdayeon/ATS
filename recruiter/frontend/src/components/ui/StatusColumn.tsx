import type { Application, Job } from '../../../../../shared/types';
import ApplicationCard from './ApplicationCard';

interface ApplicationWithJob extends Application {
  job?: Job;
}

interface StatusColumnProps {
  title: string;
  items: ApplicationWithJob[];
  emptyText: string;
  selectedJob?: Job;
  onApplicationMenuClick?: (application: Application) => void;
}

const StatusColumn = ({ 
  title, 
  items, 
  emptyText, 
  selectedJob,
  onApplicationMenuClick
}: StatusColumnProps) => {
  return (
    <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm" style={{ height: 'calc(100vh - 220px)' }}>
      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
            {items.length}
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      
      {/* 카드 리스트 - 숨겨진 스크롤 */}
      <div className="p-4 pt-3 pb-4 space-y-3 overflow-y-auto scrollbar-hide" style={{ height: 'calc(100vh - 300px)' }}>
        {items.length > 0 ? (
          items.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              selectedJob={selectedJob}
              onMenuClick={onApplicationMenuClick}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-sm">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusColumn; 