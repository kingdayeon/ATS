import { createClient } from '@supabase/supabase-js'

// 환경변수에서 Supabase 설정 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 환경변수 디버깅
console.log('🔍 환경변수 디버깅:', {
  NODE_ENV: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✅ 존재' : '❌ 없음',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ 존재' : '❌ 없음',
  allEnv: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
})

// 환경변수가 없으면 에러 출력 (하지만 앱 크래시는 방지)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경변수가 누락되었습니다!')
  console.error('필요한 환경변수: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
  console.error('현재 .env 파일 위치 확인: candidate/frontend/.env')
}

export const supabase = createClient(
  supabaseUrl || 'placeholder',
  supabaseAnonKey || 'placeholder'
)

// TypeScript 타입 정의
export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: number
          title: string
          company: string
          department: string
          experience: string
          job_type: string
          location: string
          description?: string
          team_intro?: string
          responsibilities?: string[]
          requirements?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Insert: {
          title: string
          company: string
          department: string
          experience: string
          job_type: string
          location: string
          description?: string
          team_intro?: string
          responsibilities?: string[]
          requirements?: string
          is_active?: boolean
        }
        Update: {
          title?: string
          company?: string
          department?: string
          experience?: string
          job_type?: string
          location?: string
          description?: string
          team_intro?: string
          responsibilities?: string[]
          requirements?: string
          is_active?: boolean
        }
      }
      applications: {
        Row: {
          id: number
          job_id?: number
          name: string
          email: string
          phone?: string
          english_name: string
          resume_file_url?: string
          portfolio_type?: 'file' | 'link'
          portfolio_file_url?: string
          portfolio_link?: string
          referral_source?: string
          custom_referral?: string
          required_consent: boolean
          optional_consent?: boolean
          status?: 'submitted' | 'reviewing' | 'interview' | 'rejected' | 'accepted'
          created_at?: string
          updated_at?: string
        }
        Insert: {
          job_id?: number
          name: string
          email: string
          phone?: string
          english_name: string
          resume_file_url?: string
          portfolio_type?: 'file' | 'link'
          portfolio_file_url?: string
          portfolio_link?: string
          referral_source?: string
          custom_referral?: string
          required_consent: boolean
          optional_consent?: boolean
          status?: 'submitted' | 'reviewing' | 'interview' | 'rejected' | 'accepted'
        }
        Update: {
          job_id?: number
          name?: string
          email?: string
          phone?: string
          english_name?: string
          resume_file_url?: string
          portfolio_type?: 'file' | 'link'
          portfolio_file_url?: string
          portfolio_link?: string
          referral_source?: string
          custom_referral?: string
          required_consent?: boolean
          optional_consent?: boolean
          status?: 'submitted' | 'reviewing' | 'interview' | 'rejected' | 'accepted'
        }
      }
    }
  }
} 