import { useState } from 'react';
import { format, addDays } from 'date-fns';
import type { InterviewSettings } from '../../services/calendar';
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

  const handleConfirm = async () => {
    // 유효성 검사
    if (!settings.dateRange.start || !settings.dateRange.end || !settings.timeRange.start || !settings.timeRange.end || !settings.duration) {
      alert('모든 필드를 채워주세요.');
      return;
    }

    const settingsToSave = {
      dateRange: {
        start: settings.dateRange.start,
        end: settings.dateRange.end,
      },
      timeRange: { start: settings.timeRange.start, end: settings.timeRange.end },
      duration: settings.duration,
    };

    try {
      // 1. DB에 면접 설정 저장
      const { data, error } = await supabase
        .from('interview_settings')
        .upsert({
          application_id: applicationId,
          date_range_start: settingsToSave.dateRange.start,
          date_range_end: settingsToSave.dateRange.end,
          time_range_start: settingsToSave.timeRange.start,
          time_range_end: settingsToSave.timeRange.end,
          duration: settingsToSave.duration,
          department: department,
        }, { onConflict: 'application_id' })
        .select();

      if (error) {
        throw error;
      }

      console.log('✅ 면접 설정 DB 저장 성공:', data);

      // 2. onConfirm 호출 (DB 저장 후)
      // 이제 onConfirm은 상태 변경만 트리거합니다.
      onConfirm();
    onClose();

    } catch (error: any) {
      console.error('❌ 면접 설정 저장 실패:', error);
      alert(`면접 설정 저장에 실패했습니다: ${error.message}`);
    }
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

          {/* 참고 정보 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">
                  {department === 'Design Lead' ? '1:1 면접' : '팀 면접'}
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  {department === 'Design Lead' 
                    ? '디자인 팀장과의 개별 면접입니다.'
                    : '팀장과 팀원이 함께 참여하는 면접입니다.'}
                </p>
              </div>
            </div>
          </div>
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
            className="px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            면접 일정 설정 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduleModal; 