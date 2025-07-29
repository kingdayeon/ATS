import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { applicantName, applicantEmail, jobTitle, company, newStatus, applicationId } = await req.json()
    
    console.log('📧 상태 변경 이메일 발송 요청:', { applicantName, jobTitle, newStatus, applicationId })

    // 상태별 메시지 설정
    let emailSubject = ''
    let emailContent = ''
    let slackMessage = ''

    if (newStatus === 'interview') {
      // 🎯 면접 진행 상태 - 일정 선택 링크 포함
      const interviewToken = generateInterviewToken(applicationId);
              const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5175';
        const schedulingUrl = `${frontendUrl}/interview-scheduling/${applicationId}/${interviewToken}`;
      
      emailSubject = `[${company}] 면접 일정 안내 - ${jobTitle}`
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #000; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🎉 축하합니다!</h1>
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
                아래 링크에서 편리한 시간을 선택해 주세요:
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
      `
      
      slackMessage = `🎯 *면접 진행 알림*\n\n*지원자:* ${applicantName}\n*포지션:* ${jobTitle}\n*상태:* 면접 진행\n\n📅 지원자가 면접 시간을 선택할 수 있는 링크가 발송되었습니다.\n\n*일정 선택 링크:* ${schedulingUrl}`
      
    } else if (newStatus === 'offer') {
      emailSubject = `[${company}] 최종 합격 안내 - ${jobTitle}`
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
      `
      
      slackMessage = `🎉 *최종 합격 알림*\n\n*지원자:* ${applicantName}\n*포지션:* ${jobTitle}\n*상태:* 최종 합격\n\n축하합니다! 새로운 팀원이 합류합니다.`
      
    } else if (newStatus === 'rejected') {
      emailSubject = `[${company}] 채용 결과 안내 - ${jobTitle}`
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
      `
      
      slackMessage = `💔 *채용 불합격 알림*\n\n*지원자:* ${applicantName}\n*포지션:* ${jobTitle}\n*상태:* 불합격\n\n불합격 안내 이메일이 발송되었습니다.`
    }

    // 🚀 Resend API를 통한 이메일 발송
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY가 설정되지 않았습니다.')
    }

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
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json()
      throw new Error(`이메일 발송 실패: ${JSON.stringify(errorData)}`)
    }

    console.log('✅ 이메일 발송 완료')

    // 🚀 Slack 알림 발송
    const jobDepartmentMap = {
      'Frontend Engineer': 'DEV_SLACK_WEBHOOK',
      'Backend Engineer': 'DEV_SLACK_WEBHOOK', 
      'Design Lead': 'DESIGN_SLACK_WEBHOOK'
    }

    const webhookEnvKey = jobDepartmentMap[jobTitle] || 'DEV_SLACK_WEBHOOK'
    const slackWebhook = Deno.env.get(webhookEnvKey)

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
      }

      if (newStatus === 'interview') {
        // 면접 진행 시 추가 버튼 (지원서 보기)
        slackPayload.blocks.push({
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "📋 지원서 보기"
              },
              url: `${process.env.FRONTEND_URL || 'http://localhost:5175'}/application/${applicationId}`,
              style: "primary"
            }
          ]
        })
      }

      const slackResponse = await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
      })

      if (slackResponse.ok) {
        console.log('✅ Slack 알림 발송 완료')
      } else {
        console.error('❌ Slack 알림 발송 실패:', await slackResponse.text())
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '상태 변경 이메일 및 Slack 알림 발송 완료',
        schedulingUrl: newStatus === 'interview' ? `${process.env.FRONTEND_URL || 'http://localhost:5175'}/interview-scheduling/${applicationId}/${generateInterviewToken(applicationId)}` : undefined
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('❌ 상태 변경 알림 처리 실패:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
}) 