import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import type { Job, ApplicationFormData, CompanyType, ExperienceLevel, JobType } from '@/types'

type JobRow = Database['public']['Tables']['jobs']['Row']
type ApplicationInsert = Database['public']['Tables']['applications']['Insert']

// Job 데이터를 우리 타입으로 변환하는 함수 (타입 안전성 개선)
const mapJobRowToJob = (jobRow: JobRow): Job => ({
  id: jobRow.id,
  title: jobRow.title,
  company: jobRow.company as CompanyType,
  department: jobRow.department,
  experience: jobRow.experience as ExperienceLevel,
  type: jobRow.job_type as JobType,
  location: jobRow.location,
  description: jobRow.description || '',
  teamIntro: jobRow.team_intro || '',
  responsibilities: jobRow.responsibilities || [],
  requirements: jobRow.requirements || ''
})

// 🔍 채용공고 목록 조회
export const getJobs = async (): Promise<Job[]> => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs:', error)
      throw error
    }

    return data?.map(mapJobRowToJob) || []
  } catch (error) {
    console.error('Failed to fetch jobs:', error)
    throw error
  }
}

// 🔍 특정 채용공고 상세 조회
export const getJobById = async (id: number): Promise<Job | null> => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching job:', error)
      throw error
    }

    return data ? mapJobRowToJob(data) : null
  } catch (error) {
    console.error('Failed to fetch job:', error)
    throw error
  }
}

// 📝 지원서 제출
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

// 📎 파일 업로드 (Supabase Storage)
export const uploadFile = async (
  file: File,
  bucket: 'resumes' | 'portfolios',
  applicationId: number
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${applicationId}_${Date.now()}.${fileExt}`
    const filePath = `${bucket}/${fileName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (error) {
      console.error('Error uploading file:', error)
      return { success: false, error: error.message }
    }

    // 업로드된 파일의 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Failed to upload file:', error)
    return { success: false, error: 'Failed to upload file' }
  }
}

// 📊 지원자 목록 조회 (채용담당자용)
export const getApplications = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs:job_id (
          title,
          department
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Failed to fetch applications:', error)
    throw error
  }
} 