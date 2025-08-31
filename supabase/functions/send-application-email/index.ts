import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// 직무에 따른 슬랙 채널 결정
function getSlackWebhookUrl(jobTitle) {
  const DEV_WEBHOOK = Deno.env.get('DEV_SLACK_WEBHOOK');
  const DESIGN_WEBHOOK = Deno.env.get('DESIGN_SLACK_WEBHOOK');
  const jobLower = jobTitle.toLowerCase();
  // 개발 관련 키워드
  if (jobLower.includes('frontend') || jobLower.includes('backend') || jobLower.includes('engineer') || jobLower.includes('developer') || jobLower.includes('mobile') || jobLower.includes('ios') || jobLower.includes('android')) {
    return DEV_WEBHOOK;
  }
  // 디자인 관련 키워드
  if (jobLower.includes('design') || jobLower.includes('ui') || jobLower.includes('ux') || jobLower.includes('product designer')) {
    return DESIGN_WEBHOOK;
  }
  return null;
}
// 슬랙 메시지 전송
async function sendSlackNotification(webhookUrl, data) {
  const currentTime = new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  // 환경변수 또는 기본 배포 URL 사용
  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://ats-recruiter.vercel.app';
  const dashboardUrl = frontendUrl;
  const detailUrl = data.applicationId ? `${frontendUrl}/application/${data.applicationId}` : dashboardUrl;
  const slackMessage = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🏢 DATS 새로운 지원서가 접수되었습니다!"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*지원자:*\n${data.applicantName}님`
          },
          {
            type: "mrkdwn",
            text: `*포지션:*\n${data.jobTitle}`
          },
          {
            type: "mrkdwn",
            text: `*회사:*\n${data.company}`
          },
          {
            type: "mrkdwn",
            text: `*접수시간:*\n${currentTime}`
          }
        ]
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "📋 대시보드에서 보기"
            },
            style: "primary",
            url: dashboardUrl
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "📄 지원서 상세보기"
            },
            url: detailUrl
          }
        ]
      },
      {
        type: "divider"
      }
    ]
  };
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(slackMessage)
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ 슬랙 메시지 전송 실패:', response.status, errorText);
    throw new Error(`슬랙 전송 실패: ${response.status}`);
  }
  console.log('✅ 슬랙 알림 전송 성공!');
}
Deno.serve(async (req)=>{
  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { applicantName, applicantEmail, jobTitle, company, applicationId } = await req.json();
    console.log('📄 수신된 데이터:', {
      applicantName,
      applicantEmail,
      jobTitle,
      company,
      applicationId
    });
    // 무신사 스타일 이메일 템플릿
    const emailTemplate = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>지원서 접수 완료</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo {
            background-color: #000;
            color: white;
            font-size: 18px;
            font-weight: bold;
            padding: 12px 24px;
            border-radius: 8px;
            display: inline-block;
            margin-bottom: 20px;
        }
        .title {
            font-size: 24px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
        }
        .content {
            margin-bottom: 40px;
        }
        .job-info {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .job-title {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 4px;
        }
        .company {
            color: #666;
            font-size: 14px;
        }
        .next-steps {
            background-color: #f0f7ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .footer {
            text-align: center;
            color: #999;
            font-size: 14px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
        .contact-info {
            margin-top: 20px;
            font-size: 13px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">DATS</div>
            <div class="title">지원서 접수가 완료되었습니다</div>
            <div class="subtitle">${applicantName}님, DATS에 관심을 가져주셔서 감사합니다</div>
        </div>
        
        <div class="content">
            <p>안녕하세요, <strong>${applicantName}</strong>님!</p>
            
            <p>${company}에서 진행하는 <strong>${jobTitle}</strong> 포지션에 지원해주셔서 진심으로 감사드립니다.</p>
            
            <div class="job-info">
                <div class="job-title">${jobTitle}</div>
                <div class="company">${company}</div>
            </div>
            
            <p>제출해주신 지원서는 정상적으로 접수되었으며, 저희 채용팀에서 꼼꼼히 검토한 후 빠른 시일 내에 결과를 안내드리겠습니다.</p>
            
            <div class="next-steps">
                <h3 style="margin-top: 0; color: #1e40af;">📋 다음 단계 안내</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>서류 검토: 영업일 기준 3-5일 소요</li>
                    <li>검토 완료 후 개별 이메일 연락</li>
                    <li>면접 진행 시 별도 일정 안내</li>
                </ul>
            </div>
            
            <p>궁금한 사항이 있으시면 언제든지 연락 주시기 바랍니다.</p>
            
            <p>다시 한번 DATS에 지원해주셔서 감사드리며, 좋은 결과로 만나뵐 수 있기를 기대합니다.</p>
        </div>
        
        <div class="footer">
            <p><strong>DATS 채용팀</strong></p>
            <div class="contact-info">
                <p>📧 recruiter.dayeon@gmail.com | 📞 02-1234-5678</p>
                <p>서울시 강남구 테헤란로 123, DATS빌딩</p>
                <p>본 메일은 발신전용입니다. 문의사항은 채용 담당자에게 직접 연락해주세요.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
    // 1. 이메일 발송
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY 환경변수가 설정되지 않았습니다.');
    }
    console.log('📧 이메일 발송 시작...');
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'DATS 채용팀 <onboarding@resend.dev>',
        to: [
          applicantEmail
        ],
        reply_to: 'recruiter.dayeon@gmail.com',
        subject: `[DATS] ${jobTitle} 포지션 지원서 접수 완료`,
        html: emailTemplate
      })
    });
    const emailResult = await emailResponse.json();
    if (!emailResponse.ok) {
      console.error('❌ Resend API 오류:', emailResult);
      throw new Error(`이메일 발송 실패: ${JSON.stringify(emailResult)}`);
    }
    console.log('✅ 이메일 발송 성공!');
    // 2. 슬랙 알림 발송
    const slackWebhookUrl = getSlackWebhookUrl(jobTitle);
    if (slackWebhookUrl) {
      console.log('📱 슬랙 알림 전송 시작...');
      await sendSlackNotification(slackWebhookUrl, {
        applicantName,
        applicantEmail,
        jobTitle,
        company,
        applicationId
      });
    } else {
      console.log('⚠️ 해당 직무에 매칭되는 슬랙 채널이 없습니다:', jobTitle);
    }
    return new Response(JSON.stringify({
      success: true,
      message: '이메일 발송 및 슬랙 알림 완료',
      recipient: applicantEmail,
      jobTitle,
      emailId: emailResult.id,
      slackSent: !!slackWebhookUrl
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('💥 전체 오류:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
