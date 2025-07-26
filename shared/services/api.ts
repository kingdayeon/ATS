import { supabase } from '../lib/supabase';
import type { Job, Application, ApplicationWithJob, CompanyType, ExperienceLevel, JobType, Database } from '../types';

type JobRow = Database['public']['Tables']['jobs']['Row'];

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
  requirements: jobRow.requirements || '',
  is_active: jobRow.is_active || true,
  created_at: jobRow.created_at,
  updated_at: jobRow.updated_at
});

// ===== JOB API FUNCTIONS =====

// 🔍 채용공고 목록 조회
export const getJobs = async (): Promise<Job[]> => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }

    return data?.map(mapJobRowToJob) || [];
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    throw error;
  }
};

// 🔍 특정 채용공고 상세 조회
export const getJobById = async (id: number): Promise<Job | null> => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching job:', error);
      throw error;
    }

    return data ? mapJobRowToJob(data) : null;
  } catch (error) {
    console.error('Failed to fetch job:', error);
    throw error;
  }
};

// ===== APPLICATION API FUNCTIONS =====

// 📊 지원자 목록 조회 (채용담당자용)
export const getApplications = async (): Promise<ApplicationWithJob[]> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          department,
          company,
          experience,
          job_type,
          location
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }

    // 타입 변환
    return data?.map((item: any) => ({
      ...item,
      job: item.jobs ? {
        id: item.jobs.id,
        title: item.jobs.title,
        department: item.jobs.department,
        company: item.jobs.company,
        experience: item.jobs.experience,
        type: item.jobs.job_type,
        location: item.jobs.location
      } : undefined
    })) || [];
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    throw error;
  }
};

// 🔍 특정 지원서 상세 조회
export const getApplicationById = async (id: number): Promise<ApplicationWithJob | null> => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          department,
          company,
          experience,
          job_type,
          location,
          description,
          team_intro,
          responsibilities,
          requirements
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching application:', error);
      throw error;
    }

    if (!data) return null;

    // 타입 변환
    return {
      ...data,
      job: data.jobs ? {
        id: data.jobs.id,
        title: data.jobs.title,
        department: data.jobs.department,
        company: data.jobs.company,
        experience: data.jobs.experience,
        type: data.jobs.job_type,
        location: data.jobs.location,
        description: data.jobs.description,
        teamIntro: data.jobs.team_intro,
        responsibilities: data.jobs.responsibilities,
        requirements: data.jobs.requirements
      } : undefined
    };
  } catch (error) {
    console.error('Failed to fetch application:', error);
    throw error;
  }
};

// ===== UTILITY FUNCTIONS =====

// 📎 파일 업로드 (애플리케이션용 - applicationId 포함)
export const uploadApplicationFile = async (
  file: File,
  bucket: 'resumes' | 'portfolios',
  applicationId: number
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${applicationId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true
      });

    if (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }

    // 업로드된 파일의 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Failed to upload file:', error);
    return { success: false, error: 'Failed to upload file' };
  }
}; 