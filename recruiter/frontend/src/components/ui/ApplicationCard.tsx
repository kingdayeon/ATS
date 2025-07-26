import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import type { Application, Job } from '../../../../../shared/types';
import { getDepartmentColor } from '../../../../../shared/utils';
import { useAuthStore } from '../../store/authStore';

interface ApplicationCardProps {
  application: Application;
  selectedJob?: Job;
  onMenuClick?: (application: Application) => void;
  onStatusChange?: (applicationId: number, newStatus: string) => void;
}

const ApplicationCard = ({ application, selectedJob, onMenuClick, onStatusChange }: ApplicationCardProps) => {
  const navigate = useNavigate();
  const { canChangeApplicationStatus } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCardClick = () => {
    console.log('카드 클릭됨:', application.id, application.name);
    console.log('이동할 경로:', `/application/${application.id}`);
    navigate(`/application/${application.id}`);
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 권한 체크: authStore 함수 사용
  const canChangeStatus = canChangeApplicationStatus();

  // 상태 변경 처리
  const handleStatusChange = (newStatus: string) => {
    console.log(`${application.name}의 상태를 ${newStatus}로 변경`);
    onStatusChange?.(application.id, newStatus);
    setShowDropdown(false);
  };

  return (
    <div 
      onClick={handleCardClick}
      draggable={canChangeStatus}
      onDragStart={(e) => {
        if (canChangeStatus) {
          e.dataTransfer.setData('application/json', JSON.stringify({
            id: application.id,
            name: application.name,
            currentStatus: application.status
          }));
          e.dataTransfer.effectAllowed = 'move';
        } else {
          e.preventDefault();
        }
      }}
      className={`group relative bg-white rounded-lg border p-4 hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 ${canChangeStatus ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      {/* 카드 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center flex-1">
          {/* 이름 정보 */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {application.name}
            </h4>
            <p className="text-xs text-gray-500 truncate">
              {application.english_name}
            </p>
          </div>
        </div>
        
        {/* 상태 변경 드롭다운 메뉴 */}
        {canChangeStatus && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 relative" ref={dropdownRef}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-white/80"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* 드롭다운 메뉴 */}
            {showDropdown && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
                {application.status === 'submitted' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange('interview');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      면접 전형으로 이동
                    </button>
                  </>
                )}

                {application.status === 'interview' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange('accepted');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      입사 제안으로 이동
                    </button>
                  </>
                )}

                {/* 불합격 처리 - 모든 단계에서 가능 */}
                {application.status !== 'rejected' && application.status !== 'accepted' && (
                  <>
                    <hr className="my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange('rejected');
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      불합격 처리
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 부서 태그 */}
      {selectedJob && (
        <div className="mb-3">
          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getDepartmentColor(selectedJob.department)}`}>
            {selectedJob.department}
          </span>
        </div>
      )}

      {/* 연락처 정보 */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
          <span className="truncate">{application.email}</span>
        </div>
        
        {application.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{application.phone}</span>
          </div>
        )}
      </div>

      {/* 지원 날짜 */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{new Date(application.created_at).toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
          })}</span>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard; 