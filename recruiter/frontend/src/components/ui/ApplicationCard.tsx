import type { Application, Job, ApplicationStatus } from '../../../../../shared/types';
import { useAuthStore } from '../../store/authStore';
import StatusBadge from './StatusBadge';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { getDepartmentColor } from '../../../../../shared/utils';

interface ApplicationCardProps {
  application: Application;
  selectedJob?: Job;
  statusKey: ApplicationStatus | 'final';
  onMenuClick?: (application: Application) => void;
  onStatusChange?: (applicationId: number, newStatus: string) => void;
}

const ApplicationCard = ({ application, selectedJob, statusKey, onMenuClick, onStatusChange }: ApplicationCardProps) => {
  const navigate = useNavigate();
  const { user, canChangeApplicationStatus } = useAuthStore();
  
  // --- Start of Bug Fix ---
  // 1. evaluator_ids가 null일 경우를 대비해 빈 배열로 초기화합니다.
  const evaluatorIds = application.evaluator_ids || [];
  // 2. user.id가 존재하는지 확인하고, 타입을 맞춰서 안전하게 비교합니다.
  const hasEvaluated = user ? evaluatorIds.includes(user.id) : false;
  
  // 3. average_score가 null이나 undefined가 아닐 때만 점수를 계산합니다.
  const averageScore = application.average_score != null ? Math.round(application.average_score) : null;
  // --- End of Bug Fix ---

  // ... (기존 드롭다운 및 핸들러 로직은 그대로 유지)
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const handleCardClick = () => navigate(`/application/${application.id}`);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const canChangeStatus = canChangeApplicationStatus();
  const handleStatusChange = (newStatus: string) => {
    onStatusChange?.(application.id, newStatus);
    setShowDropdown(false);
  };

  return (
    <div 
      onClick={handleCardClick}
      draggable={canChangeStatus}
      onDragStart={(e) => {
        if (canChangeStatus) {
          e.dataTransfer.setData('application/json', JSON.stringify({ id: application.id, name: application.name, currentStatus: application.status }));
          e.dataTransfer.effectAllowed = 'move';
        } else {
          e.preventDefault();
        }
      }}
      className={`group relative bg-white rounded-lg border p-4 hover:shadow-md transition-all duration-200 cursor-pointer border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 ${canChangeStatus ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-sm truncate">{application.name}</h4>
            {statusKey === 'final' && <StatusBadge status={application.final_status} />}
          </div>
          <p className="text-xs text-gray-500 truncate">{application.english_name}</p>
        </div>
        {/* ... (드롭다운 메뉴 버튼 UI) */}
      </div>
      
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* '입사 제안'과 '최종 결과'가 아닐 때만 평가 뱃지 표시 */}
          {statusKey !== 'accepted' && statusKey !== 'final' && (
            <>
              {averageScore !== null && (
                <span className="font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                  평균 {averageScore}점
                </span>
              )}
              {hasEvaluated ? (
                <span className="font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200">
                  평가 완료
                </span>
              ) : (
                <span className="font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                  미평가
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
          <span className="truncate">{application.email}</span>
        </div>
        {application.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            <span>{application.phone}</span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span>{new Date(application.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard; 