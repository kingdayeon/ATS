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
  job_id: number; // 💡 jobId 추가
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

        // 1. 지원자 정보 조회 (job_id 포함)
        const { data: application, error: appError } = await supabase
          .from('applications')
          .select(`
            id, name, email,
            jobs:job_id (
              id,
              title,
              department
            )
          `)
          .eq('id', appIdNum)
          .single();

        if (appError || !application) throw new Error('지원서를 찾을 수 없습니다.');

        const applicantInfo: ApplicantInfo = {
          id: application.id,
          name: application.name,
          email: application.email,
          job_title: (application.jobs as any)?.title || '',
          department: (application.jobs as any)?.department || '',
          job_id: (application.jobs as any)?.id, // 💡 jobId 저장
        };
        setApplicant(applicantInfo);
        console.log('✅ 지원자 정보:', applicantInfo);

        // 2. 이미 예약된 시간 목록 조회
        console.log(`[DB] 📅 ${applicantInfo.department} 부서의 기예약 시간 조회`);
        const { data: bookedSlots, error: bookedSlotsError } = await supabase
          .from('booked_interview_times')
          .select('start_time')
          .eq('department', applicantInfo.department);
        
        if (bookedSlotsError) throw new Error('기존 예약 정보를 가져오는데 실패했습니다.');
        
        const bookedStartTimes = new Set(bookedSlots.map(s => s.start_time));
        console.log(`[DB] ✅ 기예약 시간 ${bookedStartTimes.size}개 확인`);

        // 3. 선택 가능한 시간 목록 조회
        console.log('[DB] 🕐 선택 가능한 전체 시간 슬롯 조회');
        const { data: availableSlotsFromDB, error: slotsError } = await supabase
          .from('interview_available_slots')
          .select('*')
          .eq('application_id', appIdNum)
          .order('slot_start', { ascending: true });

        if (slotsError) throw new Error('면접 시간을 조회할 수 없습니다.');
        if (!availableSlotsFromDB) {
          setAvailableSlots([]);
          return;
        }

        // 4. 기예약된 시간을 제외한 최종 슬롯 계산
        const filteredSlots: TimeSlot[] = availableSlotsFromDB
          .map((slot: AvailableInterviewSlot) => ({
            start: slot.slot_start,
            end: slot.slot_end,
            available: slot.is_available,
          }))
          .filter(slot => !bookedStartTimes.has(slot.start)); // 💡 여기서 중복 제거

        setAvailableSlots(filteredSlots);
        console.log(`[UI] ✅ 최종적으로 선택 가능한 시간 ${filteredSlots.length}개 표시`);

      } catch (error) {
        console.error('면접 일정 데이터 조회 실패:', error);
        setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedulingData();
  }, [applicationId, token]);
  
  // ✨ [실시간] 다른 사람이 예약하면 내 화면에서도 해당 슬롯 제거
  useEffect(() => {
    if (!applicant?.department) return;

    const channel = supabase.channel(`booked-slots-${applicant.department}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'booked_interview_times',
          filter: `department=eq.${applicant.department}` 
        },
        (payload) => {
          const newBookedSlot = payload.new as { start_time: string };
          console.log('[REALTIME] ⚡️ 실시간 예약 발생! 내 화면에서 해당 슬롯 제거:', newBookedSlot.start_time);
          setAvailableSlots(prevSlots =>
            prevSlots.filter(slot => slot.start !== newBookedSlot.start_time)
          );
          // 내가 선택한 슬롯이 방금 예약되었다면, 내 선택도 취소
          if (selectedSlot?.start === newBookedSlot.start_time) {
            setSelectedSlot(null);
            alert('죄송합니다. 방금 다른 지원자가 해당 시간을 선택했습니다. 다른 시간을 골라주세요.');
          }
        }
      )
      .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
  }, [applicant?.department, selectedSlot]);


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

    // ✨ [수정] 백엔드 함수 명세에 맞게 데이터 전달
    try {
      setIsSubmitting(true);
      console.log('📝 면접 시간 확정 시작:', selectedSlot);

      const { data, error } = await supabase.functions.invoke('confirm-interview-schedule', {
        body: {
          applicationId: applicant.id,
          jobId: applicant.job_id,
          department: applicant.department,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }
      });

      if (error) {
        // 409 Conflict 에러는 이미 예약되었다는 의미
        if ((error as any).context?.status === 409) {
          const responseBody = await (error as any).context.json();
          // 실시간으로 슬롯이 제거되기 전에 클릭한 경우이므로, UI를 한번 더 업데이트
          setAvailableSlots(prev => prev.filter(s => s.start !== selectedSlot.start));
          setSelectedSlot(null);
          throw new Error(responseBody.message || '이미 예약된 시간입니다.');
        }
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
                          disabled={!slot.available} // 💡 이 부분은 DB에서 is_available=false인 경우를 위해 남겨둡니다.
                          className={`p-2 rounded-md text-center transition-all duration-200 ${
                            selectedSlot?.start === slot.start
                              ? 'bg-black text-white shadow-lg scale-105'
                              : 'bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed'
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