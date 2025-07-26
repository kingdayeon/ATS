interface EmailData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  company: string;
  applicationId?: number;
}

interface StatusChangeEmailData {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  company: string;
  newStatus: string;
  applicationId: number;
}

// Supabase Edge Function을 통한 이메일 발송
export const sendApplicationEmail = async (emailData: EmailData): Promise<void> => {
  try {
    // Supabase Edge Function URL
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL이 설정되지 않았습니다.');
    }
    
    const functionUrl = `${supabaseUrl}/functions/v1/send-application-email`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''}`
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`이메일 발송 실패: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('📧 이메일 발송 결과:', result);
    
  } catch (error) {
    console.error('❌ 이메일 발송 오류:', error);
    throw error;
  }
};

// 상태 변경 시 이메일 발송 
export const sendStatusChangeEmail = async (emailData: StatusChangeEmailData): Promise<void> => {
  try {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('VITE_SUPABASE_URL이 설정되지 않았습니다.');
    }
    
    const functionUrl = `${supabaseUrl}/functions/v1/send-status-change-email`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''}`
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`상태 변경 이메일 발송 실패: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    console.log('📧 상태 변경 이메일 발송 결과:', result);
    
  } catch (error) {
    console.error('❌ 상태 변경 이메일 발송 오류:', error);
    throw error;
  }
}; 