import { useState } from 'react';
import { format, addDays } from 'date-fns';
import type { InterviewSettings } from '../../../../../shared/types';
import { supabase } from '../../../../../shared/lib/supabase';

interface InterviewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: InterviewSettings) => void;
  applicationId: number;
  department: string;
  applicantName: string;
}

const InterviewScheduleModal = ({
  isOpen,
  onClose,
  onConfirm,
  applicationId,
  department,
  applicantName
}: InterviewScheduleModalProps) => {
  // 기본값 설정 (내일부터 3일 후까지, 10-18시, 1시간)
  const tomorrow = addDays(new Date(), 1);
  const dayAfter3 = addDays(new Date(), 4);

  const [settings, setSettings] = useState<InterviewSettings>({
    dateRange: {
      start: format(tomorrow, 'yyyy-MM-dd'),
      end: format(dayAfter3, 'yyyy-MM-dd')
    },
    timeRange: {
      start: '10:00',
      end: '18:00'
    },
    duration: 60, // 기본 1시간
    applicationId,
    department
  });

  // 날짜 및 시간 유효성 검사
  const isDateRangeValid = settings.dateRange.start <= settings.dateRange.end;
  const isTimeRangeValid = settings.timeRange.start < settings.timeRange.end;
  const isFormValid = isDateRangeValid && isTimeRangeValid;

  const handleConfirm = () => {
    if (!isFormValid) {
      alert('날짜 및 시간 범위를 올바르게 설정해주세요.');
      return;
    }
    
    // ✨ [수정] 백엔드가 이해할 수 있는 평평한 구조로 객체를 변환하여 전달
    const settingsForBackend: any = {
      date_range_start: settings.dateRange.start,
      date_range_end: settings.dateRange.end,
      time_range_start: settings.timeRange.start,
      time_range_end: settings.timeRange.end,
      duration: settings.duration,
      // 기존에 있던 다른 정보들도 함께 전달
      applicationId: settings.applicationId,
      department: settings.department,
    };

    onConfirm(settingsForBackend);
    onClose();
  };

  const updateDateRange = (field: 'start' | 'end', value: string) => {
    setSettings(prev => ({
      ...prev,
      dateRange: { ...prev.dateRange, [field]: value }
    }));
  };

  const updateTimeRange = (field: 'start' | 'end', value: string) => {
    setSettings(prev => ({
      ...prev,
      timeRange: { ...prev.timeRange, [field]: value }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* 헤더 */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              면접 일정 설정
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {applicantName}님의 {department} 면접 일정을 설정해주세요
          </p>
        </div>

        {/* 내용 */}
        <div className="px-6 py-4 space-y-6">
          {/* 면접 가능 날짜 범위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              📅 면접 가능 날짜 범위
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">시작일</label>
                <input
                  type="date"
                  value={settings.dateRange.start}
                  onChange={(e) => updateDateRange('start', e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">종료일</label>
                <input
                  type="date"
                  value={settings.dateRange.end}
                  onChange={(e) => updateDateRange('end', e.target.value)}
                  min={settings.dateRange.start}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm"
                />
              </div>
            </div>
          </div>

          {/* 면접 가능 시간 범위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🕐 면접 가능 시간 범위
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">시작 시간</label>
                <input
                  type="time"
                  value={settings.timeRange.start}
                  onChange={(e) => updateTimeRange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">종료 시간</label>
                <input
                  type="time"
                  value={settings.timeRange.end}
                  onChange={(e) => updateTimeRange('end', e.target.value)}
                  min={settings.timeRange.start}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              예: 10:00 ~ 18:00 (점심시간 제외)
            </p>
          </div>

          {/* 면접 소요 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ⏱️ 면접 소요 시간
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 90, 120].map((duration) => (
                <button
                  key={duration}
                  onClick={() => setSettings(prev => ({ ...prev, duration }))}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    settings.duration === duration
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {duration === 30 ? '30분' : 
                   duration === 60 ? '1시간' :
                   duration === 90 ? '1.5시간' : '2시간'}
                </button>
              ))}
            </div>
          </div>

          {/* 유효성 검사 오류 메시지 */}
          {!isDateRangeValid && (
            <p className="text-sm text-red-500">종료일은 시작일보다 빠를 수 없습니다.</p>
          )}
          {!isTimeRangeValid && (
            <p className="text-sm text-red-500">종료 시간은 시작 시간보다 빨라야 합니다.</p>
          )}

          {/* "팀 면접" 박스는 제거됨 */}
        </div>

        {/* 푸터 */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isFormValid} // 유효성 검사에 따라 버튼 비활성화
            className="px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            면접 일정 설정 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduleModal; 