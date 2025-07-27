import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { TimeSlot } from '../services/calendar';
import { supabase } from '../../../../shared/lib/supabase';
import { validateInterviewToken } from '../../../../shared/utils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';
import { useAuthStore } from '../store/authStore';

// 지원자 정보
interface ApplicantInfo {
  id: number;
  name: string;
  email: string;
  job_title: string;
  department: string;
}

// DB에 저장된 면접 시간 슬롯
interface AvailableInterviewSlot {
  id: number;
  application_id: number;
  slot_start: string;
  slot_end: string;
  is_available: boolean;
  created_at: string;
}

const InterviewScheduling = () => {
  const { applicationId, token } = useParams();
  const navigate = useNavigate();
  
  const [applicant, setApplicant] = useState<ApplicantInfo | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔍 지원자 정보 및 미리 계산된 면접 시간 조회
  useEffect(() => {
    const fetchSchedulingData = async () => {
      try {
        if (!applicationId || !token) {
          throw new Error('잘못된 접근입니다.');
        }

        // 🔐 토큰 검증
        const appIdNum = parseInt(applicationId);
        if (!validateInterviewToken(token, appIdNum)) {
          throw new Error('유효하지 않거나 만료된 링크입니다.');
        }

        setIsLoading(true);
        console.log(`📋 면접 일정 조회: applicationId=${applicationId}`);

        // 지원자 정보 조회
        const { data: application, error: appError } = await supabase
          .from('applications')
          .select(`
            id, name, email,
            jobs:job_id (
              title,
              department
            )
          `)
          .eq('id', appIdNum)
          .single();

        if (appError || !application) {
          throw new Error('지원서를 찾을 수 없습니다.');
        }

        const applicantInfo: ApplicantInfo = {
          id: application.id,
          name: application.name,
          email: application.email,
          job_title: (application.jobs as any)?.title || '',
          department: (application.jobs as any)?.department || ''
        };

        setApplicant(applicantInfo);
        console.log('✅ 지원자 정보:', applicantInfo);

        // 🕐 DB에서 미리 계산된 면접 가능 시간 조회
        console.log('📅 DB에서 사전 계산된 면접 시간 조회 중...');
        
        const { data: slots, error: slotsError } = await supabase
          .from('interview_available_slots')
          .select('*')
          .eq('application_id', appIdNum)
          .eq('is_available', true)
          .order('slot_start', { ascending: true });

        if (slotsError) {
          console.error('면접 시간 조회 실패:', slotsError);
          throw new Error('면접 시간을 조회할 수 없습니다.');
        }

        if (!slots || slots.length === 0) {
          console.warn('사전 계산된 면접 시간이 없습니다.');
          setAvailableSlots([]);
        } else {
          // DB 데이터를 TimeSlot 형식으로 변환
          const formattedSlots: TimeSlot[] = slots.map((slot: AvailableInterviewSlot) => ({
            start: slot.slot_start,
            end: slot.slot_end,
            available: slot.is_available
          }));

          setAvailableSlots(formattedSlots);
          console.log(`✅ 사전 계산된 면접 시간 ${formattedSlots.length}개 조회 완료`);
        }

      } catch (error) {
        console.error('면접 일정 데이터 조회 실패:', error);
        setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedulingData();
  }, [applicationId, token]);

  // 📅 시간 슬롯 선택
  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    console.log('선택된 시간:', slot);
  };

  // ✅ 면접 시간 확정
  const handleConfirmSchedule = async () => {
    if (!selectedSlot || !applicant) {
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('📝 면접 시간 확정 시작:', selectedSlot);

      // 🚀 Edge Function 호출 (applicationId와 selectedSlot만 전달)
      const { data, error } = await supabase.functions.invoke('confirm-interview-schedule', {
        body: {
          applicationId: applicant.id,
          selectedSlot: selectedSlot,
        }
      });

      if (error) {
        throw error;
      }
      
      if (!data?.success) {
        console.error('면접 시간 확정 실패:', data?.logs);
        throw new Error(data?.error || '면접 시간 확정에 실패했습니다.');
      }

      console.log('✅ 면접 시간 확정 완료!', data);
      
      // 완료 페이지로 이동
      navigate(`/interview-scheduled/${applicationId}`);

    } catch (error: any) {
      console.error('면접 시간 확정 실패:', error);
      alert(error.message || '면접 시간 확정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 📅 날짜별 시간 슬롯 그룹화
  const groupSlotsByDate = (slots: TimeSlot[]) => {
    const grouped: Record<string, TimeSlot[]> = {};
    
    slots.forEach(slot => {
      const date = slot.start.split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });

    return grouped;
  };

  // 🔄 로딩 중
  if (isLoading) {
    return <LoadingSpinner message="면접 가능 시간 조회 중..." />;
  }

  // ❌ 에러 상태
  if (error) {
    return <ErrorDisplay message={error} />;
  }

  // 🔄 데이터 없음
  if (!applicant) {
    return <ErrorDisplay message="면접 정보를 찾을 수 없습니다." />;
  }

  const groupedSlots = groupSlotsByDate(availableSlots);
  const dates = Object.keys(groupedSlots).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">면접 일정 선택</h1>
            </div>
            <p className="text-gray-600">
              {applicant.name}님, <span className="font-medium">{applicant.job_title}</span> 면접 시간을 선택해 주세요
            </p>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {availableSlots.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">예약 가능한 시간이 없습니다</h2>
            <p className="text-gray-600">
              면접 가능한 시간이 아직 설정되지 않았습니다.<br />
              담당자에게 문의해 주세요.
            </p>
          </div>
        ) : (
          <>
            {/* 날짜별 시간 슬롯 (스크롤 가능 영역) */}
            <div className="space-y-8 max-h-[calc(100vh-400px)] overflow-y-auto pr-3">
              {dates.map(date => {
                const dateObj = new Date(date);
                const slots = groupedSlots[date];
                
                return (
                  <div key={date} className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {format(dateObj, 'M월 d일 (E)', { locale: ko })}
                    </h2>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.start}
                          onClick={() => handleSlotSelect(slot)}
                          className={`p-2 rounded-md text-center transition-all duration-200 ${
                            selectedSlot?.start === slot.start
                              ? 'bg-black text-white shadow-lg scale-105'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {format(new Date(slot.start), 'HH:mm')} - {format(new Date(slot.end), 'HH:mm')}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 선택된 시간 표시 및 확정 버튼 */}
            <div className={`mt-8 transition-all duration-300 ${selectedSlot ? 'opacity-100' : 'opacity-0 -translate-y-4'}`}>
              {selectedSlot && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-lg animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">선택된 면접 시간</h3>
                      <p className="text-gray-600 mt-1">
                        {format(new Date(selectedSlot.start), 'M월 d일 (E) HH:mm', { locale: ko })}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        💡 면접 시간이 확정되면 면접관들에게 자동으로 알림이 발송됩니다.
                      </p>
                    </div>
                    
                    <button
                      onClick={handleConfirmSchedule}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          확정 중...
                        </>
                      ) : (
                        '면접 시간 확정'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default InterviewScheduling; 