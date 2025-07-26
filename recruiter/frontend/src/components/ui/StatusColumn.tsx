import { useState } from 'react';
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
  onStatusChange?: (applicationId: number, newStatus: string) => void;
  statusKey: string; // 'submitted', 'reviewing', 'interview', 'accepted'
}

const StatusColumn = ({ 
  title, 
  items, 
  emptyText, 
  selectedJob,
  onApplicationMenuClick,
  onStatusChange,
  statusKey
}: StatusColumnProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  // 드래그앤드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      const { id, currentStatus, name } = dragData;
      
      // 같은 상태로 드롭하는 경우 무시
      if (currentStatus === statusKey) {
        console.log(`${name}: 같은 상태로 드롭 무시`);
        return;
      }

      // 드래그 방향 제한: 순방향만 허용 (submitted → interview → accepted)
      const statusOrder = ['submitted', 'interview', 'accepted'];
      const currentIndex = statusOrder.indexOf(currentStatus);
      const targetIndex = statusOrder.indexOf(statusKey);
      
      // 유효하지 않은 상태인 경우 차단
      if (currentIndex === -1 || targetIndex === -1) {
        console.log(`유효하지 않은 상태: ${currentStatus} -> ${statusKey}`);
        return;
      }
      
      // 역방향 이동 방지 (현재 >= 타겟)
      if (currentIndex >= targetIndex) {
        console.log(`역방향 이동 불가: ${currentStatus} -> ${statusKey}`);
        alert('이전 단계로는 되돌릴 수 없습니다.\n불합격 처리는 별도 버튼을 사용해주세요.');
        return;
      }
      
      console.log(`✅ 지원자 ${name}를 ${currentStatus} -> ${statusKey}로 이동`);
      onStatusChange?.(id, statusKey);
    } catch (error) {
      console.error('드롭 데이터 파싱 오류:', error);
    }
  };

  return (
    <div 
      className={`flex flex-col bg-white rounded-lg border shadow-sm transition-all duration-200 h-auto lg:h-[calc(100vh-220px)] ${
        isDragOver 
          ? 'border-blue-400 bg-blue-50 border-2' 
          : 'border-gray-200'
      }`} 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
      <div className="p-4 pt-3 pb-4 space-y-3 overflow-y-auto scrollbar-hide h-auto lg:h-[calc(100vh-300px)]">
        {items.length > 0 ? (
          items.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              selectedJob={selectedJob}
              onMenuClick={onApplicationMenuClick}
              onStatusChange={onStatusChange}
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