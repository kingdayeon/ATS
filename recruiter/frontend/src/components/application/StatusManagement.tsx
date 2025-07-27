import { useState } from 'react';
import type { ApplicationStatus } from '../../../../../shared/types';
import { useAuthStore } from '../../store/authStore';
import InterviewScheduleModal from '../interview/InterviewScheduleModal';
import type { InterviewSettings } from '../../services/calendar';
import { supabase } from '../../../../../shared/lib/supabase';

interface StatusManagementProps {
  currentStatus: ApplicationStatus;
  onStatusChange: (newStatus: ApplicationStatus, interviewSettings?: InterviewSettings) => Promise<void>;
  applicationId: number;
  applicantName: string;
  department: string;
}

const StatusManagement = ({ 
  currentStatus, 
  onStatusChange,
  applicationId,
  applicantName,
  department
}: StatusManagementProps) => {
  const { canChangeApplicationStatus } = useAuthStore();
  const [isModalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleConfirmSchedule = async (settings: InterviewSettings) => {
    try {
      // 1. 먼저 면접 설정을 DB에 저장
      await supabase.from('interview_settings').upsert({
        application_id: applicationId,
        date_range_start: settings.dateRange.start,
        date_range_end: settings.dateRange.end,
        time_range_start: settings.timeRange.start,
        time_range_end: settings.timeRange.end,
        duration: settings.duration,
        department: department,
      }, { onConflict: 'application_id' });

      // 2. 면접 상태로 변경
      onStatusChange('interview');
      setModalOpen(false);
    } catch (error: any) {
      console.error('면접 승인 실패:', error);
      alert(`면접 승인 중 오류가 발생했습니다: ${error.message}`);
    }
  };
  
  const handleSelectChange = (value: ApplicationStatus) => {
    if (value === 'interview') {
      handleOpenModal();
    } else {
      // 면접이 아닌 경우 바로 상태 변경
      const nextStatus = getNextStatus(value);
      if (nextStatus) {
        onStatusChange(nextStatus);
      }
    }
  };

  // 다음 단계 상태 계산
  const getNextStatus = (status: ApplicationStatus): ApplicationStatus | null => {
    switch (status) {
      case 'submitted': return 'interview';
      case 'interview': return 'accepted';
      default: return null;
    }
  };

  // 다음 단계 텍스트
  const getNextStatusText = (status: ApplicationStatus): string | null => {
    switch (status) {
      case 'submitted': return '면접 승인';
      case 'interview': return '최종 합격';
      default: return null;
    }
  };

  // 면접 승인 버튼 클릭 (모달 표시)
  const handleInterviewApproval = () => {
    if (currentStatus === 'submitted') {
      console.log('면접 일정 설정 모달 표시');
      handleOpenModal();
    } else {
      // 면접이 아닌 경우 바로 상태 변경
      const nextStatus = getNextStatus(currentStatus);
      if (nextStatus) {
        onStatusChange(nextStatus);
      }
    }
  };

  // 권한이 없으면 렌더링하지 않음
  if (!canChangeApplicationStatus()) {
    return null;
  }

  const nextStatus = getNextStatus(currentStatus);
  const nextStatusText = getNextStatusText(currentStatus);

  return (
    <>
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">전형 관리</h3>
        <div className="flex gap-3">
          {/* 다음 단계 이동 버튼 */}
          {nextStatus && (
            <button
              onClick={handleInterviewApproval}
              className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {nextStatusText}
            </button>
          )}
          
          {/* 불합격 처리 버튼 */}
          {currentStatus !== 'rejected' && currentStatus !== 'accepted' && (
            <button
              onClick={() => onStatusChange('rejected')}
              className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              불합격 처리
            </button>
          )}
        </div>
      </div>

      {/* 면접 일정 설정 모달 */}
      <InterviewScheduleModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmSchedule}
        applicationId={applicationId}
        applicantName={applicantName}
        department={department}
      />
    </>
  );
};

export default StatusManagement; 