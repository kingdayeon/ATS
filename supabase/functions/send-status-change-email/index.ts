/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

// 🔧 CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// 📧 면접 일정 선택을 위한 보안 토큰 생성
const generateInterviewToken = (applicationId) => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const payload = `${applicationId}-${timestamp}-${randomStr}`;
  
  // Base64 인코딩
  return btoa(payload).replace(/[+/=]/g, m => {
    return m === '+' ? '-' : m === '/' ? '_' : '';
  });
};

// 헬퍼 함수 추가: 토큰 생성
const generateToken = (applicationId: string, secret: string) => {
  return btoa(`${applicationId}-${secret}`);
};

// 🎯 부서별 면접관 조회
const getInterviewersByDepartment = async (supabase, department, addLog) => {
  addLog(`[DB] 📋 === DB에서 ${department} 부서 면접관 조회 시작 ===`);

  // Job title을 실제 DB 부서명으로 매핑
  const departmentMapping = {
    'Frontend Engineer': 'dev',
    'Backend Engineer': 'dev', 
    'Design Lead': 'design',
    'Product Manager': 'product',
    'Data Analyst': 'data',
    'QA Engineer': 'qa'
  };

  const jobTitle = department; // 파라미터 'department'는 실제로는 jobTitle임
  let dbDepartment = '';

  for (const key in departmentMapping) {
    if (jobTitle.includes(key)) {
      dbDepartment = departmentMapping[key];
      break;
    }
  }
  if (!dbDepartment) {
    addLog(`[DB] ⚠️ '${jobTitle}'에 해당하는 부서 매핑을 찾지 못했습니다. 폴백(fallback) 로직을 사용합니다.`);
    dbDepartment = jobTitle.toLowerCase();
  }
  addLog(`[DB] 🔄 직무 매핑: '${jobTitle}' → '${dbDepartment}'`);

  const { data: users, error } = await supabase
    .from('users')
    .select('id, name, email, role, department')
    .eq('department', dbDepartment)
    .in('role', ['manager', 'viewer'])
    .neq('role', 'admin');

  if (error) {
    addLog(`[DB] ❌ 면접관 조회 실패: ${error.message}`);
    return [];
  }
  if (!users || users.length === 0) {
    addLog(`[DB] ⚠️ ${dbDepartment} 부서에 면접관이 없습니다.`);
    return [];
  }

  const interviewers = users.map((user) => ({
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    calendarId: user.email,
    department: user.department,
    role: user.role === 'manager' ? 'manager' : 'member'
  }));

  addLog(`[DB] ✅ ${dbDepartment} 부서 면접관 ${interviewers.length}명 조회 완료`);
  return interviewers;
};

// 📅 Google Calendar에서 바쁜 시간 조회 (jose 라이브러리 사용)
const getCalendarBusyTimes = async (calendarId, startDate, endDate, addLog) => {
  try {
    addLog(`  [GCAL] 📅 === ${calendarId} 구글 캘린더 조회 시작 ===`);
    addLog(`  [GCAL] 🕐 조회 기간: ${startDate} ~ ${endDate}`);
    
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      addLog('  [GCAL] ⚠️ GOOGLE_SERVICE_ACCOUNT_KEY가 .env 파일에 설정되지 않음 - 빈 일정으로 처리');
      return [];
    }
    
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    // 🕐 JWT 토큰 생성 (jose 라이브러리)
    addLog('  [GCAL] 🎯 JWT 토큰 생성 시작 (jose 라이브러리 사용)...');
    const privateKeyObject = await jose.importPKCS8(serviceAccount.private_key, 'RS256');
    
    const jwt = await new jose.SignJWT({ scope: "https://www.googleapis.com/auth/calendar.readonly" })
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuedAt()
        .setIssuer(serviceAccount.client_email)
        .setAudience('https://oauth2.googleapis.com/token')
        .setExpirationTime('1h')
        .sign(privateKeyObject);
    addLog('  [GCAL] ✅ JWT 토큰 생성 완료');

    // 🔐 Access Token 요청
    addLog('  [GCAL] 🌐 Google OAuth 토큰 요청 시작...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      addLog(`  [GCAL] ❌ Google 토큰 요청 실패: ${errorText}`);
      return [];
    }
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    addLog('  [GCAL] ✅ Google Access Token 획득 완료');

    // 📅 실제 Google Calendar FreeBusy API 호출
    addLog(`  [GCAL] 📊 Google Calendar FreeBusy API 호출 시작...`);
    const freeBusyResponse = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeMin: startDate,
        timeMax: endDate,
        items: [{ id: calendarId }]
      })
    });

    addLog(`  [GCAL] 📡 FreeBusy API 응답: ${freeBusyResponse.status} ${freeBusyResponse.statusText}`);
    if (!freeBusyResponse.ok) {
      const errorText = await freeBusyResponse.text();
      addLog(`  [GCAL] ❌ Calendar API 오류 (${freeBusyResponse.status}): ${errorText}`);
      return [];
    }

    const freeBusyData = await freeBusyResponse.json();
    addLog(`  [GCAL CRITICAL] Google FreeBusy API 응답 전문 for ${calendarId}: ${JSON.stringify(freeBusyData, null, 2)}`);

    const calendarData = freeBusyData.calendars?.[calendarId];
    if (!calendarData || calendarData.errors) {
      addLog(`  [GCAL] ⚠️ ${calendarId} 캘린더 데이터 없거나 오류 - 빈 일정 처리. 오류: ${JSON.stringify(calendarData?.errors)}`);
      return [];
    }

    const busyTimes = calendarData.busy || [];
    const formattedBusyTimes = busyTimes.map((busy) => ({
      start: busy.start,
      end: busy.end
    }));

    addLog(`  [GCAL] 🎯 === ${calendarId} 최종 바쁜 시간 결과: ${formattedBusyTimes.length}개 ===`);
    return formattedBusyTimes;

  } catch (error) {
    addLog(`  [GCAL] ❌ === ${calendarId} 캘린더 조회 실패: ${error.message} ===`);
    addLog(`  [GCAL] ❌ Stack: ${error.stack}`);
    return [];
  }
};

// 🕐 가능한 면접 시간 슬롯 생성 (시간대 인식 - 최종 수정 4)
const generateAvailableSlots = (interviewersBusyTimes: any, dateRange: any, timeRange: any, duration: number, addLog) => {
    const slots: any[] = [];
    try {
        const { start: startDateStr, end: endDateStr } = dateRange;
        const { start: startTimeStr, end: endTimeStr } = timeRange;
        
        addLog(`[generateAvailableSlots] KST 기준 슬롯 생성 시작: ${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`);

        const [startHour, startMinute] = startTimeStr.split(':').map(Number);
        const [endHour, endMinute] = endTimeStr.split(':').map(Number);
        const durationMillis = duration * 60 * 1000;
        const intervalMillis = 30 * 60 * 1000; // 30분 간격으로 시작 시간 체크

        addLog('[generateAvailableSlots] 1. 바쁜 시간 밀리초로 변환 시작...');
        const allBusyMillis: { start: number; end: number }[] = [];
        
        // 호환성 문제를 피하기 위해 Object.values 대신 for...in 루프 사용
        for (const key in interviewersBusyTimes) {
            if (Object.prototype.hasOwnProperty.call(interviewersBusyTimes, key)) {
                const busyArray = interviewersBusyTimes[key];
                for (const busy of (busyArray as any[])) {
                    allBusyMillis.push({
                        start: new Date(busy.start).getTime(),
                        end: new Date(busy.end).getTime()
                    });
                }
            }
        }
        addLog(`[generateAvailableSlots] 1. 바쁜 시간 변환 완료: 총 ${allBusyMillis.length}개`);

        let currentDate = new Date(`${startDateStr}T00:00:00Z`);
        const finalDate = new Date(`${endDateStr}T00:00:00Z`);

        addLog('[generateAvailableSlots] 2. 날짜 루프 시작...');
        while (currentDate <= finalDate) {
            addLog(`[generateAvailableSlots]   - 처리 중인 날짜: ${currentDate.toISOString().split('T')[0]}`);
            const dailyStartMillis = new Date(currentDate).setUTCHours(startHour - 9, startMinute, 0, 0);
            const dailyEndMillis = new Date(currentDate).setUTCHours(endHour - 9, endMinute, 0, 0);

            for (let slotStartMillis = dailyStartMillis; slotStartMillis < dailyEndMillis; slotStartMillis += intervalMillis) {
                const slotEndMillis = slotStartMillis + durationMillis;

                if (slotEndMillis > dailyEndMillis) {
                    continue;
                }

                let isAvailable = true;
                for (const busy of allBusyMillis) {
                    if (slotStartMillis < busy.end && slotEndMillis > busy.start) {
                        isAvailable = false;
                        break;
                    }
                }

                if (isAvailable) {
                    slots.push({
                        start: new Date(slotStartMillis).toISOString(),
                        end: new Date(slotEndMillis).toISOString(),
                        available: true,
                    });
                }
            }
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
        addLog(`[generateAvailableSlots] 2. 날짜 루프 완료`);
        addLog(`[generateAvailableSlots] ✅ 생성된 슬롯 ${slots.length}개`);

    } catch (e) {
        addLog("[CRITICAL] generateAvailableSlots에서 심각한 오류 발생:", e);
        throw new Error(`generateAvailableSlots crashed: ${e.message}`);
    }
    return slots;
};

// 🗄️ DB에 면접 가능 시간 저장
const saveInterviewSlots = async (supabase, applicationId, slots, addLog) => {
  try {
    addLog(`[DB] 💾 === DB에 면접 시간 저장 시작 ===`);
    addLog(`[DB] 📊 저장할 시간 슬롯: ${slots.length}개`);
    
    // 기존 슬롯 삭제
    addLog('[DB] 🗑️ 기존 면접 시간 슬롯 삭제 중...');
    const { error: deleteError } = await supabase.from('interview_available_slots').delete().eq('application_id', applicationId);
    
    if (deleteError) {
      addLog(`[DB] ❌ 기존 슬롯 삭제 실패: ${deleteError.message}`);
    } else {
      addLog('[DB] ✅ 기존 슬롯 삭제 완료');
    }
    
    if (slots.length === 0) {
      addLog('[DB] ⚠️ 저장할 면접 시간이 없음 - 프로세스 종료');
      return true;
    }
    
    // 새 슬롯 저장
    addLog('[DB] 📝 새로운 면접 시간 슬롯 생성 중...');
    const slotsToInsert = slots.map((slot) => ({
      application_id: applicationId,
      slot_start: slot.start,
      slot_end: slot.end,
      is_available: slot.available
    }));
    
    const { data: insertData, error: insertError } = await supabase.from('interview_available_slots').insert(slotsToInsert).select();
    
    if (insertError) {
      addLog(`[DB] ❌ 면접 시간 저장 실패: ${insertError.message}`);
      return false;
    }
    
    addLog(`[DB] ✅ DB 저장 성공! 총 ${insertData?.length || 0}개 슬롯 저장됨`);
    return true;
    
  } catch (error) {
    addLog(`[DB] ❌ === 면접 시간 저장 중 오류: ${error.message} ===`);
    return false;
  }
};

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let logs: string[] = [];
  const addLog = (message: string) => {
    console.log(message);
    logs.push(message);
  };

  try {
    const { 
      applicantName, 
      applicantEmail, 
      jobTitle, 
      company, 
      newStatus, 
      applicationId,
      interviewDetails, // 💡 프론트에서 직접 전달받는 면접 정보
    } = await req.json();

    addLog('🚀 === 상태 변경 이메일 발송 요청 시작 ===');
    addLog(`📊 요청 데이터: ${JSON.stringify({ applicantName, applicantEmail, jobTitle, company, newStatus, applicationId, interviewDetails })}`);
  
    // Supabase 클라이언트 초기화
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    addLog('✅ Supabase 클라이언트 초기화 완료');
    
    // 상태별 메시지 설정
    let emailSubject = '';
    let emailContent = '';
    let slackMessage = '';
    let schedulingUrl = '';

    switch (newStatus) {
      case 'interview':
        addLog('🎯 === 면접 진행 상태 처리 시작 ===');
        
        // 💣 [제거] DB에서 면접 설정 조회하는 기존 로직
        // addLog('📦 DB에서 면접 설정 조회 중...');
        // const { data: interviewSettings, error: settingsError } = await supabase
        //   .from('interview_settings')
        //   .select('*')
        //   .eq('application_id', applicationId)
        //   .single();
        //
        // if (settingsError || !interviewSettings) {
        //   addLog(`❌ 면접 설정 조회 실패: ${settingsError?.message || '데이터 없음'}`);
        //   throw new Error('면접 설정을 찾을 수 없습니다. 면접 일정을 다시 설정해주세요.');
        // }

        // ✨ [변경] 프론트에서 직접 받은 interviewDetails 사용
        const interviewSettings = interviewDetails;
        addLog(`✅ 프론트엔드로부터 직접 면접 설정 수신 완료: ${JSON.stringify(interviewSettings)}`);

        // 1. 면접관 조회
        addLog('👥 STEP 1: 면접관 조회 시작...');
        const interviewers = await getInterviewersByDepartment(supabase, jobTitle, addLog);
        
        if (interviewers.length === 0) {
          addLog('⚠️  면접관이 없어서 면접 시간 생성 불가');
        } else {
          addLog(`✅ 면접관 ${interviewers.length}명 조회 완료: ${interviewers.map((i) => `${i.name}(${i.email})`).join(', ')}`);
          
          // 2. 면접관들의 바쁜 시간 조회
          addLog('📅 STEP 2: 면접관 바쁜 시간 조회 시작...');
                  const interviewersBusyTimes = {};
        const allBusyTimes: any[] = []; // For logging
          
          // 시간대 및 날짜 범위 설정 (KST 기준)
          const timeZone = 'Asia/Seoul';
          const searchStartDate = interviewSettings.date_range_start;
          const searchEndDate = interviewSettings.date_range_end;
          
          // UTC 시간으로 완벽하게 통일
          const timeMin = new Date(`${searchStartDate}T00:00:00+09:00`).toISOString();
          const searchEndDateTime = new Date(searchEndDate);
          searchEndDateTime.setDate(searchEndDateTime.getDate() + 1);
          const timeMax = new Date(searchEndDateTime.setHours(0, 0, 0, 0) - (9 * 60 * 60 * 1000)).toISOString();
          
          addLog(`🔍 Google Calendar 조회 기간 (UTC): ${timeMin} ~ ${timeMax}`);
          
          for (const interviewer of interviewers) {
            addLog(`  → ${interviewer.name}(${interviewer.email}) 캘린더 조회 중...`);
            const busyTimes = await getCalendarBusyTimes(interviewer.calendarId, timeMin, timeMax, addLog);
            interviewersBusyTimes[interviewer.calendarId] = busyTimes;
            
            allBusyTimes.push({
              interviewer: interviewer.email,
              busy: busyTimes
            });
            
            addLog(`  ✅ ${interviewer.name}: 바쁜 시간 ${busyTimes.length}개`);
            if (busyTimes.length > 0) {
              busyTimes.forEach((busy, index) => {
                addLog(`    ${index + 1}. ${busy.start} ~ ${busy.end}`);
              });
            }
          }
          
          addLog(`📊 모든 면접관 바쁜 시간 조회 완료`);
          addLog(`[DEBUG] 조회된 모든 면접관의 바쁜 시간: ${JSON.stringify(allBusyTimes, null, 2)}`);
          
          // 3. 가능한 면접 시간 계산
          addLog('🕐 STEP 3: 가능한 면접 시간 계산 시작...');
          const availableSlots = generateAvailableSlots(
            interviewersBusyTimes,
            { start: interviewSettings.date_range_start, end: interviewSettings.date_range_end },
            { start: interviewSettings.time_range_start, end: interviewSettings.time_range_end },
            interviewSettings.duration,
            addLog
          );
          
          addLog(`📈 계산된 가능한 면접 시간: ${availableSlots.length}개`);
          
          if (availableSlots.length === 0) {
            addLog(`[CRITICAL] ⚠️ 생성된 면접 가능 시간이 0개입니다. 면접관들의 일정이 모두 겹치거나, 조회 기간에 가능한 시간이 없는지 확인하세요. 입력된 바쁜 시간 데이터를 확인해주세요.`);
          } else {
            addLog(`[DEBUG] 생성된 시간 슬롯 목록 (최대 5개): ${JSON.stringify(availableSlots.slice(0, 5), null, 2)}`);
          }
          
          availableSlots.forEach((slot, index) => {
            addLog(`  ${index + 1}. ${slot.start} ~ ${slot.end}`);
          });
          
          // 4. DB에 저장
          addLog('💾 STEP 4: DB에 면접 시간 저장 시작...');
          const saveResult = await saveInterviewSlots(supabase, applicationId, availableSlots, addLog);
          
          if (saveResult) {
            addLog('[SUCCESS] ✅ DB에 면접 시간 저장 프로세스 성공!');
            
            // DB 저장 확인
            const { data: savedSlots, error: checkError } = await supabase
              .from('interview_available_slots')
              .select('*')
              .eq('application_id', applicationId)
              .eq('is_available', true);
            
            if (checkError) {
              addLog(`[ERROR] ❌ DB 저장 후 확인 과정에서 오류 발생: ${JSON.stringify(checkError)}`);
            } else {
              addLog(`[VERIFICATION] 🔍 DB 확인 결과: 총 ${savedSlots?.length || 0}개의 면접 시간이 성공적으로 저장되었습니다.`);
              if (savedSlots && savedSlots.length > 0) {
                addLog(`[VERIFICATION-DETAIL] 저장된 슬롯 (샘플): ${JSON.stringify(savedSlots[0], null, 2)}`);
              }
            }
          } else {
            addLog('[CRITICAL] ❌ DB에 면접 시간 저장 실패! Edge Function의 이전 로그를 확인하여 원인을 파악하세요.');
          }
        }

        // 면접 일정 선택 링크 생성
        addLog('🔗 STEP 5: 면접 일정 선택 링크 생성...');
        const interviewToken = generateInterviewToken(applicationId);
        schedulingUrl = `http://localhost:5175/interview-scheduling/${applicationId}/${interviewToken}`;
        addLog(`✅ 면접 일정 링크: ${schedulingUrl}`);

        emailSubject = `[${company}] 면접 일정 안내 - ${jobTitle}`;
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #000; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">축하합니다!</h1>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                안녕하세요 <strong>${applicantName}</strong>님,
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                ${company}의 <strong>${jobTitle}</strong> 포지션 지원서 검토 결과, 
                <span style="color: #22c55e; font-weight: bold;">면접 단계로 진행</span>하게 되었습니다.
              </p>
              
              <div style="background: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">📅 면접 일정 선택</h3>
                <p style="margin: 0; color: #6b7280;">
                  아래 링크에서 가능한 시간을 선택해 주세요:
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${schedulingUrl}" 
                   style="background: #000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  📅 면접 시간 선택하기
                </a>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>💡 참고사항:</strong><br>
                  • 링크는 24시간 동안 유효합니다<br>
                  • 선택한 시간은 면접관들에게 자동으로 공유됩니다<br>
                  • 일정 변경이 필요한 경우 담당자에게 연락해 주세요
                </p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                추가 문의사항이 있으시면 언제든 연락해 주세요.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                감사합니다.<br>
                <strong>${company} 채용팀</strong>
              </p>
            </div>
            
            <div style="background: #e5e7eb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
              본 메일은 자동 발송된 메일입니다.
            </div>
          </div>
        `;
        
        slackMessage = `*면접 진행 알림*\n\n*지원자:* ${applicantName}\n*포지션:* ${jobTitle}\n*상태:* 면접 진행\n\n📅 지원자에게 면접 시간 선택 이메일이 발송되었습니다.`;
        
        break;

      case 'rejected':
        addLog('💔 === 불합격 상태 처리 ===');
        
        emailSubject = `[${company}] 채용 결과 안내 - ${jobTitle}`;
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #6b7280; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">채용 결과 안내</h1>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                안녕하세요 <strong>${applicantName}</strong>님,
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                ${company}의 <strong>${jobTitle}</strong> 포지션 지원에 관심을 가져주셔서 감사합니다.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                신중한 검토 결과, 아쉽게도 이번 기회에는 함께 하지 못하게 되었습니다.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                향후 적합한 포지션이 있을 때 다시 연락드릴 수 있도록 이력서를 보관하겠습니다.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                다시 한번 관심과 시간을 내어 지원해 주셔서 감사합니다.<br>
                <strong>${company} 채용팀</strong>
              </p>
            </div>
          </div>
        `;
        
        slackMessage = `💔 *채용 불합격 알림*\n\n*지원자:* ${applicantName}\n*포지션:* ${jobTitle}\n*상태:* 불합격\n\n불합격 안내 이메일이 발송되었습니다.`;
        
        break;

      case 'accepted':
        addLog('🎉 === 입사 제안 상태 처리 ===');
        
        const secretKey = Deno.env.get("FUNCTION_SECRET_KEY") ?? "default-secret";
        const token = generateToken(String(applicationId), secretKey);
        // ✨ 프론트엔드 URL 포트 번호 수정
        const frontendUrl = 'http://localhost:5175'; // 5174 -> 5175

        const acceptUrl = `${frontendUrl}/finalize-status/${applicationId}/hired/${token}`;
        const declineUrl = `${frontendUrl}/finalize-status/${applicationId}/offer_declined/${token}`;

        emailSubject = `[${company}] 무신사 입사 제안 안내`;
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px;">
            <div style="background: #000; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🎉 입사를 제안합니다!</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                안녕하세요 <strong>${applicantName}</strong>님,
              </p>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                무신사 ${jobTitle} 포지션에 최종 합격하신 것을 진심으로 축하드립니다.
              </p>
              <div style="background: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">📝 입사 의사 확인</h3>
                <p style="margin: 0; color: #6b7280;">
                  아래 버튼을 통해 입사 의사를 전달해주세요.
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 15px;">
                  ✅ 입사 결정
                </a>
                <a href="${declineUrl}" style="background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  ❌ 입사 취소
                </a>
              </div>
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                ${applicantName}님과 함께하게 되기를 기대합니다!
              </p>
            </div>
          </div>
        `;
        slackMessage = `🎉 *입사 제안 알림*\n\n*지원자:* ${applicantName}\n*포지션:* ${jobTitle}\n\n지원자에게 입사 수락/취소 이메일이 발송되었습니다.`;
        break;

      case 'offer':
        addLog('🎉 === 최종 합격 상태 처리 ===');
        
        emailSubject = `[${company}] 최종 합격 안내 - ${jobTitle}`;
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #22c55e; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 최종 합격을 축하드립니다!</h1>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                안녕하세요 <strong>${applicantName}</strong>님,
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                ${company}의 <strong>${jobTitle}</strong> 포지션에 
                <span style="color: #22c55e; font-weight: bold;">최종 합격</span>하셨습니다!
              </p>
              
              <div style="background: white; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">📝 다음 단계</h3>
                <p style="margin: 0; color: #6b7280;">
                  입사 절차 관련 상세 안내는 별도로 연락드리겠습니다.
                </p>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                함께 일할 수 있게 되어 기대됩니다!
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                감사합니다.<br>
                <strong>${company} 채용팀</strong>
              </p>
            </div>
          </div>
        `;
        
        slackMessage = `🎉 *최종 합격 알림*\n\n*지원자:* ${applicantName}\n*포지션:* ${jobTitle}\n*상태:* 최종 합격\n\n축하합니다! 새로운 팀원이 합류합니다.`;
        
        break;

      default:
        addLog(`⚠️ 알 수 없는 상태: ${newStatus}`);
        throw new Error(`지원되지 않는 상태입니다: ${newStatus}`);
    }

    // 🚀 Resend API를 통한 이메일 발송
    addLog('📧 STEP 6: 이메일 발송 시작...');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY가 설정되지 않았습니다.');
    }
    
    addLog(`📨 이메일 정보: ${applicantEmail} / ${emailSubject} / 내용 길이: ${emailContent.length}자`);
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: [applicantEmail],
        subject: emailSubject,
        html: emailContent,
      }),
    });

    if (!emailResponse.ok) {
      const responseText = await emailResponse.text();
      addLog(`❌ 이메일 발송 실패 Raw Response: ${responseText}`);
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(`이메일 발송 실패: ${JSON.stringify(errorData)}`);
      } catch (e) {
        throw new Error(`이메일 발송 서버가 JSON이 아닌 응답을 반환했습니다: ${responseText}`);
      }
    }

    const emailResult = await emailResponse.json();
    addLog(`✅ 이메일 발송 완료: ${JSON.stringify(emailResult)}`);

    // 🚀 Slack 알림 발송
    addLog('📱 STEP 7: Slack 알림 발송 시작...');
    
    const jobDepartmentMap = {
      'Frontend Engineer': 'DEV_SLACK_WEBHOOK',
      'Backend Engineer': 'DEV_SLACK_WEBHOOK',
      'Design Lead': 'DESIGN_SLACK_WEBHOOK',
    };
    
    const webhookEnvKey = jobDepartmentMap[jobTitle] || 'DEV_SLACK_WEBHOOK';
    const slackWebhook = Deno.env.get(webhookEnvKey);
    
    addLog(`🔍 Slack 설정: ${jobTitle} → ${webhookEnvKey} → ${slackWebhook ? '✅ 설정됨' : '❌ 없음'}`);
    
    if (slackWebhook) {
      const slackPayload = {
        text: slackMessage,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: slackMessage
            }
          }
        ]
      };

      if (newStatus === 'interview') {
        // 면접 진행 시에는 '지원서 보기' 버튼만 표시
        (slackPayload.blocks as any[]).push({
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "📄 지원서 보기"
              },
              url: `http://localhost:5175/application/${applicationId}`,
              style: "primary"
            }
          ]
        });
      }

      const slackResponse = await fetch(slackWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slackPayload)
      });

      if (slackResponse.ok) {
        addLog('✅ Slack 알림 발송 완료');
      } else {
        const slackError = await slackResponse.text();
        addLog(`❌ Slack 알림 발송 실패: ${slackError}`);
      }
    } else {
      addLog('⚠️  Slack 웹훅이 설정되지 않아 Slack 알림을 건너뜁니다.');
    }

    addLog('🎉 === 전체 프로세스 완료 ===');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: '상태 변경 이메일 및 Slack 알림 발송 완료',
        schedulingUrl: schedulingUrl || undefined,
        logs: logs,
        details: {
          emailSent: true,
          slackSent: !!slackWebhook,
          interviewSlotsGenerated: newStatus === 'interview'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('❌ 전체 프로세스 중 오류 발생:', error);
    console.error('스택 트레이스:', error.stack);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        logs: [...logs, `[ERROR] 전체 프로세스 중 오류: ${error.message}`]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});