/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts';
import { format } from 'https://deno.land/std@0.168.0/datetime/mod.ts';

// 🔧 CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 헬퍼 함수: 부서별 면접관 조회
const getInterviewersByDepartment = async (supabase, department, addLog) => {
  addLog(`[DB] 📋 === DB에서 ${department} 부서 면접관 조회 시작 ===`);
  const departmentMapping = {
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

  if (error) {
    addLog(`[DB] ❌ 면접관 조회 실패: ${error.message}`);
    return [];
  }
  addLog(`[DB] ✅ ${dbDepartment} 부서 면접관 ${users.length}명 조회 완료`);
  return users.map(user => ({ ...user, calendarId: user.email }));
};

// 헬퍼 함수: Refresh Token으로 Access Token 발급
const getGoogleAccessToken = async (supabase, addLog) => {
  try {
    addLog('[AUTH] 채용 담당자의 Refresh Token 조회 시작...');
    const { data: recruiter, error: recruiterError } = await supabase
      .from('users')
      .select('provider_refresh_token')
      .eq('email', 'recruiter.dayeon@gmail.com') // 하드코딩된 채용 담당자 이메일
      .single();

    if (recruiterError || !recruiter?.provider_refresh_token) {
      throw new Error(`채용 담당자(recruiter.dayeon@gmail.com)의 provider_refresh_token을 찾을 수 없습니다: ${recruiterError?.message}`);
    }
    const refreshToken = recruiter.provider_refresh_token;
    addLog('[AUTH] ✅ Refresh Token 조회 성공');

    addLog('[AUTH] 🌐 Access Token 발급 요청 시작...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: Deno.env.get('GOOGLE_CLIENT_ID'),
        client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Google Access Token 발급 실패: ${errorText}`);
    }
    const tokenData = await tokenResponse.json();
    addLog('[AUTH] ✅ Access Token 발급 성공');
    return tokenData.access_token;

  } catch (error) {
    addLog(`[AUTH] ❌ Access Token 생성 실패: ${error.message}`);
    return null;
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const logs: string[] = [];
  const addLog = (message: string) => {
    console.log(message);
    logs.push(message);
  };

  try {
    const { applicationId, selectedSlot } = await req.json();

    if (!applicationId || !selectedSlot) {
      throw new Error('applicationId와 selectedSlot이 필요합니다.');
    }

    const supabase = createClient( Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' );
    
    addLog(`[INFO] 면접 확정 프로세스 시작: Application ID ${applicationId}`);

    const { data: applicationData, error: appError } = await supabase.from('applications')
      .select('*, jobs(title, department)').eq('id', applicationId).single();
    if (appError) throw new Error(`지원자 정보 조회 실패: ${appError.message}`);
    if (!applicationData.jobs) throw new Error(`직무 정보가 없습니다.`);
    const { jobs: job, ...applicant } = applicationData;
    
    const interviewers = await getInterviewersByDepartment(supabase, job.department, addLog);
    if (interviewers.length === 0) throw new Error('면접관을 찾을 수 없습니다.');
    
    const accessToken = await getGoogleAccessToken(supabase, addLog);
    if (!accessToken) throw new Error('Google API 인증에 실패했습니다.');

    addLog('[GCAL] 🗓️ 채용 담당자 캘린더에 이벤트 생성 시작...');
    const event = {
      summary: `${job.title} 면접: ${applicant.name}님`,
      description: `지원자 상세 페이지: http://localhost:5175/application/${applicationId}`,
      start: { dateTime: selectedSlot.start, timeZone: 'Asia/Seoul' },
      end: { dateTime: selectedSlot.end, timeZone: 'Asia/Seoul' },
      attendees: interviewers.map(i => ({ email: i.email })),
      conferenceData: {
        createRequest: { 
          requestId: `meet-${applicationId}-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' } 
        }
      },
    };
    
    const createEventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }
    );

    if (!createEventResponse.ok) {
      const errorText = await createEventResponse.text();
      throw new Error(`Google Calendar 이벤트 생성 실패: ${errorText}`);
    }
    const eventData = await createEventResponse.json();
    addLog(`[GCAL] ✅ Google Calendar 이벤트 생성 완료: ${eventData.htmlLink}`);
    
    await supabase.from('applications').update({ 
        interview_scheduled_at: selectedSlot.start,
        status: 'interview'
    }).eq('id', applicationId);
    addLog('[DB] ✅ 지원자 상태 및 면접 시간 업데이트 완료');
    
    const slackWebhook = Deno.env.get('DEV_SLACK_WEBHOOK');
    if (slackWebhook) {
      const startTime = format(new Date(selectedSlot.start), "yyyy-MM-dd HH:mm", { timeZone: "Asia/Seoul" });
      const slackMessage = {
        text: `✅ 면접 일정 확정: ${applicant.name} - ${job.title}`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: '✅ 면접 일정 확정 알림' } },
          { type: 'section', fields: [
              { type: 'mrkdwn', text: `*지원자:*\n${applicant.name}` },
              { type: 'mrkdwn', text: `*포지션:*\n${job.title}` },
              { type: 'mrkdwn', text: `*면접 시간:*\n${startTime}` },
          ]},
          { type: 'actions', elements: [
              { type: 'button', text: { type: 'plain_text', text: '📅 캘린더에서 보기' }, url: eventData.htmlLink, style: 'primary' },
              { type: 'button', text: { type: 'plain_text', text: '📄 지원서 보기' }, url: `http://localhost:5175/application/${applicationId}` },
          ]},
        ],
      };
      await fetch(slackWebhook, { method: 'POST', body: JSON.stringify(slackMessage), headers: {'Content-Type': 'application/json'} });
      addLog('[SLACK] ✅ Slack 알림 발송 완료');
    }

    return new Response(
      JSON.stringify({ success: true, message: "면접이 확정되고 캘린더에 등록되었습니다.", logs }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    addLog(`[ERROR] ❌ 전체 프로세스 실패: ${error.message}`);
    return new Response(
      JSON.stringify({ success: false, error: error.message, logs }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 