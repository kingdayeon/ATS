import { supabase } from '@/lib/supabase'
import type { Database } from '../../../../shared/types'
import type { ApplicationFormData } from '@/types'

// 🔄 공통 API 함수들은 로컬 shared-api에서 import
export { getJobs, getJobById, getApplications } from './shared-api';

// 📎 파일 업로드는 로컬 shared-api 버전 사용
export { uploadApplicationFile as uploadFile } from './shared-api';

type ApplicationInsert = Database['public']['Tables']['applications']['Insert']

// 📝 지원서 제출 (candidate 전용)
export const submitApplication = async (
  jobId: number,
  formData: ApplicationFormData
): Promise<{ success: boolean; applicationId?: number; error?: string }> => {
  try {
    // ApplicationFormData를 DB Insert 타입으로 변환
    const applicationData: ApplicationInsert = {
      job_id: jobId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      english_name: formData.englishName,
      portfolio_type: formData.portfolioType,
      portfolio_link: formData.portfolioLink || undefined,
      referral_source: formData.referralSource || undefined,
      custom_referral: formData.customReferral || undefined,
      required_consent: formData.requiredConsent,
      optional_consent: formData.optionalConsent,
      status: 'submitted'
    }

    const { data, error } = await supabase
      .from('applications')
      .insert([applicationData])
      .select()
      .single()

    if (error) {
      console.error('Error submitting application:', error)
      return { success: false, error: error.message }
    }

    return { success: true, applicationId: data.id }
  } catch (error) {
    console.error('Failed to submit application:', error)
    return { success: false, error: 'Failed to submit application' }
  }
} 