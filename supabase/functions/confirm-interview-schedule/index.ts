/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// 💣 [제거] 더 이상 사용되지 않는 jose 라이브러리
// import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 헬퍼 함수: 부서별 면접관 조회
const getInterviewersByDepartment = async (supabase: any, department: any) => {
  const departmentMapping: { [key: string]: string } = {
    'Frontend Engineer': 'dev', 'Backend Engineer': 'dev', 'Design Lead': 'design',
    'Product Manager': 'product', 'Data Analyst': 'data', 'QA Engineer': 'qa'
  };
  let dbDepartment = '';
  for (const key in departmentMapping) {
    if (department.includes(key)) {
      dbDepartment = departmentMapping[key];
      break;
    }
  }
  if (!dbDepartment) dbDepartment = department.toLowerCase();
  
  const { data: users, error } = await supabase.from('users').select('id, name, email, role, department')
    .eq('department', dbDepartment).in('role', ['manager', 'viewer']);

  if (error) throw new Error(`면접관 조회 실패: ${error.message}`);
  return users.map((user: any) => ({ ...user, calendarId: user.email }));
};

// ✨ [수정] Google Access Token 발급 방식을 Refresh Token 방식으로 되돌립니다.
const getGoogleAccessToken = async (supabase: any) => {
  console.log('[AUTH] 채용 담당자의 Refresh Token 조회 시작...');
  // 특정 채용 담당자 계정의 Refresh Token을 사용 (하드코딩)
  const { data: recruiter, error: recruiterError } = await supabase
    .from('users')
    .select('provider_refresh_token')
    .eq('email', 'recruiter.dayeon@gmail.com')
    .single();

  if (recruiterError || !recruiter?.provider_refresh_token) {
    throw new Error(`채용 담당자(recruiter.dayeon@gmail.com)의 provider_refresh_token을 찾을 수 없습니다: ${recruiterError?.message}`);
  }
  const refreshToken = recruiter.provider_refresh_token;
  console.log('[AUTH] ✅ Refresh Token 조회 성공');

  console.log('[AUTH] 🌐 Access Token 발급 요청 시작...');
  // @ts-ignore
  const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
  // @ts-ignore
  const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    })
  });

  if (!tokenResponse.ok) {
    throw new Error(`Google Access Token 발급 실패: ${await tokenResponse.text()}`);
  }
  const tokenData = await tokenResponse.json();
  console.log('[AUTH] ✅ Access Token 발급 성공');
  return tokenData.access_token;
};


// ✨ [추가] Slack 알림 발송 헬퍼 함수
const sendSlackNotification = async (jobTitle: string, applicantName: string, startTime: string, applicationId: number) => {
  // @ts-ignore
  const jobDepartmentMap: { [key: string]: string } = {
    // @ts-ignore
    'Frontend Engineer': Deno.env.get('DEV_SLACK_WEBHOOK'),
    // @ts-ignore
    'Backend Engineer': Deno.env.get('DEV_SLACK_WEBHOOK'),
    // @ts-ignore
    'Design Lead': Deno.env.get('DESIGN_SLACK_WEBHOOK'),
  };
  
  let webhookUrl;
  for (const key in jobDepartmentMap) {
    if (jobTitle.includes(key)) {
      webhookUrl = jobDepartmentMap[key];
      break;
    }
  }
  // @ts-ignore
  if (!webhookUrl) webhookUrl = Deno.env.get('DEV_SLACK_WEBHOOK'); // 기본값
  
  if (!webhookUrl) {
    console.log('Slack 웹훅 URL이 설정되지 않아 알림을 건너뜁니다.');
    return;
  }
  
  const formattedTime = new Date(startTime).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'long', timeStyle: 'short' });
  const message = {
    text: `✅ 면접 일정 확정: ${applicantName} - ${jobTitle}`,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: '✅ 면접 일정 확정 알림' } },
      { type: 'section', fields: [
          { type: 'mrkdwn', text: `*지원자:*\n${applicantName}` },
          { type: 'mrkdwn', text: `*포지션:*\n${jobTitle}` },
          { type: 'mrkdwn', text: `*면접 시간:*\n${formattedTime}` },
      ]},
      { type: 'actions', elements: [
          { type: 'button', text: { type: 'plain_text', text: '📄 지원서 보기' }, url: `http://localhost:5175/application/${applicationId}` },
      ]},
    ],
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
};


// 메인 함수
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { applicationId, jobId, department, startTime, endTime } = await req.json();

    // Supabase 클라이언트 초기화 (서비스 키 사용)
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // --- 1. DB에 면접 시간 예약 (동시성 제어) ---
    const { error: bookingError } = await supabase
      .from('booked_interview_times')
      .insert({
        application_id: applicationId,
        job_id: jobId,
        department: department,
        start_time: startTime,
        end_time: endTime,
      });

    if (bookingError) {
      if (bookingError.code === '23505') {
        return new Response(
          JSON.stringify({ success: false, message: '이미 예약된 시간입니다.', error_code: 'SLOT_ALREADY_BOOKED' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`DB 예약 실패: ${bookingError.message}`);
    }

    // --- 2. 필요한 정보 조회 ---
    const { data: appData, error: appError } = await supabase
      .from('applications').select('name, email, jobs(title)')
      .eq('id', applicationId).single();
    if (appError || !appData) throw new Error(`지원자 정보 조회 실패: ${appError?.message}`);
    
    const interviewers = await getInterviewersByDepartment(supabase, department);
    if (interviewers.length === 0) throw new Error('면접관을 찾을 수 없습니다.');

    // --- 3. Google Calendar 이벤트 생성 ---
    const accessToken = await getGoogleAccessToken(supabase); // ✨ supabase 클라이언트를 인자로 전달
    const event = {
      summary: `${(appData.jobs as any).title} 면접: ${appData.name}님`,
      description: `지원자 상세 페이지: http://localhost:5175/application/${applicationId}`, // 포트 및 주소는 환경에 맞게 조정 필요
      start: { dateTime: startTime, timeZone: 'Asia/Seoul' },
      end: { dateTime: endTime, timeZone: 'Asia/Seoul' },
      attendees: interviewers.map((i: any) => ({ email: i.email })),
      conferenceData: {
        createRequest: { 
          requestId: `meet-${applicationId}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' } 
        }
      },
    };
    
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }
    );
    if (!calendarResponse.ok) {
      // 캘린더 생성 실패 시 에러를 던져서 전체 롤백 (더 안정적인 처리)
      throw new Error(`Google Calendar 이벤트 생성 실패: ${await calendarResponse.text()}`);
    }
    const calendarEvent = await calendarResponse.json();
    console.log('✅ Google Calendar 이벤트 생성 완료:', calendarEvent.htmlLink);


    // --- 4. 지원자에게 확정 이메일 발송 ---
    // @ts-ignore
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
        const formattedStartTime = new Date(startTime).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'short' });
        const emailContent = `<h4>🎉 면접 일정이 확정되었습니다.</h4><p>안녕하세요, ${appData.name}님.</p><p>${(appData.jobs as any).title} 포지션 면접이 아래와 같이 확정되었습니다.</p><p><strong>일시:</strong> ${formattedStartTime}</p><p>화상회의 링크가 포함된 캘린더 초대를 확인해주세요.</p>`;
        
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: '무신사 채용팀 <onboarding@resend.dev>', // ✨ 발신자 이름 수정
                to: [appData.email],
                subject: `[무신사] ${(appData.jobs as any).title} 면접 일정이 확정되었습니다.`, // ✨ 이메일 제목 수정
                html: emailContent,
            }),
        });
    }

    // --- 5. Slack 알림 발송 ---
    await sendSlackNotification((appData.jobs as any).title, appData.name, startTime, applicationId);


    // --- 6. 지원서 상태 업데이트 ---
    await supabase.from('applications').update({ 
      status: 'interview',
      interview_scheduled_at: startTime, // ✨ DB에도 확정된 시간 저장
     }).eq('id', applicationId);

    return new Response(
      JSON.stringify({ success: true, message: '면접이 확정되고 캘린더에 등록되었습니다.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 