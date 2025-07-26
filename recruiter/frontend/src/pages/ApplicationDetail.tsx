import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import { supabase } from '../lib/supabase';
import type { Application, Job, ApplicationStatus } from '../../../../shared/types';
import { getDepartmentColor } from '../../../../shared/utils';
import { sendStatusChangeEmail } from '../../../../shared/services/email';
import { useAuthStore } from '../store/authStore';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { canChangeApplicationStatus } = useAuthStore();
  const [application, setApplication] = useState<Application | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resume' | 'portfolio'>('resume');

  // 🎯 상태 변경 핸들러 (이메일/슬랙 알림 포함)
  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!application || !job) return;

    try {
      console.log(`지원자 ID ${application.id}의 상태를 ${newStatus}로 변경`);
      
      // 상태 업데이트
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', application.id);

      if (error) {
        console.error('상태 변경 오류:', error);
        alert('상태 변경에 실패했습니다.');
        return;
      }

      // 📧 이메일 발송 (백그라운드)
      try {
        await sendStatusChangeEmail({
          applicantName: application.name,
          applicantEmail: application.email,
          jobTitle: job.title,
          company: job.company,
          newStatus: newStatus,
          applicationId: application.id
        });
        console.log('📧 상태 변경 이메일 발송 완료!');
      } catch (emailError) {
        console.error('⚠️ 이메일 발송 실패 (상태 변경은 완료됨):', emailError);
      }

      // ✅ 화면 즉시 업데이트
      setApplication(prev => prev ? { ...prev, status: newStatus } : null);
      console.log('✅ 상태 변경 완료!');
      
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 다음 단계 상태 계산
  const getNextStatus = (currentStatus: ApplicationStatus): ApplicationStatus | null => {
    switch (currentStatus) {
      case 'submitted': return 'interview';
      case 'interview': return 'accepted';
      default: return null;
    }
  };

  // 다음 단계 텍스트
  const getNextStatusText = (currentStatus: ApplicationStatus): string | null => {
    switch (currentStatus) {
      case 'submitted': return '면접 승인';
      case 'interview': return '최종 합격';
      default: return null;
    }
  };

  useEffect(() => {
    const fetchApplication = async () => {
      if (!id) return;

      try {
        setIsLoading(true);

        // 지원서 정보 가져오기
        const { data: applicationData, error: appError } = await supabase
          .from('applications')
          .select('*')
          .eq('id', parseInt(id))
          .single();

        if (appError) throw appError;

        setApplication(applicationData);
        console.log('로드된 지원서 정보:', applicationData);

        // 채용공고 정보 가져오기
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', applicationData.job_id)
          .single();

        if (jobError) throw jobError;

        setJob(jobData);
        console.log('로드된 채용공고 정보:', jobData);
      } catch (error) {
        console.error('지원서 상세 정보 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplication();
  }, [id]);

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'submitted': '지원 접수',
      'reviewing': '서류 전형',
      'interview': '면접 진행',
      'accepted': '입사 제안',
      'rejected': '불합격'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'submitted': 'bg-blue-100 text-blue-700 border-blue-200',
      'reviewing': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'interview': 'bg-purple-100 text-purple-700 border-purple-200',
      'accepted': 'bg-green-100 text-green-700 border-green-200',
      'rejected': 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getCurrentPdfUrl = () => {
    if (activeTab === 'resume') return application?.resume_file_url;
    if (activeTab === 'portfolio') return application?.portfolio_file_url;
    return null;
  };

  // Default layout plugin instance
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">지원서 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!application || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">지원서를 찾을 수 없습니다.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">지원자 상세</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8">
        {/* 왼쪽: 지원자 정보 */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* 프로필 헤더 */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">{application.name}</h2>
              <p className="text-gray-600">{application.english_name}</p>
              <div className="mt-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                  {getStatusText(application.status)}
                </span>
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">지원 정보</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">지원 직책</p>
                    <p className="text-sm font-medium text-gray-900">{job.title}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border mt-1 ${getDepartmentColor(job.department)}`}>
                      {job.department}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">지원 일자</p>
                    <p className="text-sm text-gray-900">
                      {new Date(application.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">연락처</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <span>{application.email}</span>
                  </div>
                  
                  {application.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{application.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {application.referral_source && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">지원 경로</h3>
                  <p className="text-sm text-gray-600">{application.referral_source}</p>
                  {application.custom_referral && (
                    <p className="text-sm text-gray-500 mt-1">{application.custom_referral}</p>
                  )}
                </div>
              )}

              {/* 🎯 상태 변경 버튼들 (팀장 이상만) */}
              {canChangeApplicationStatus() && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">전형 관리</h3>
                  <div className="flex gap-3">
                    {/* 다음 단계 이동 버튼 */}
                    {getNextStatus(application.status) && (
                      <button
                        onClick={() => handleStatusChange(getNextStatus(application.status)!)}
                        className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                      >
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {getNextStatusText(application.status)}
                      </button>
                    )}
                    
                    {/* 불합격 처리 버튼 */}
                    {application.status !== 'rejected' && application.status !== 'accepted' && (
                      <button
                        onClick={() => handleStatusChange('rejected')}
                        className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                      >
                        <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        불합격 처리
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: PDF 뷰어 */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* 탭 헤더 */}
            <div className="border-b border-gray-200">
              <div className="flex">
                {application.resume_file_url && (
                  <button
                    onClick={() => setActiveTab('resume')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'resume'
                        ? 'border-black text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    이력서
                  </button>
                )}
                
                {application.portfolio_file_url && application.portfolio_type === 'file' && (
                  <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      activeTab === 'portfolio'
                        ? 'border-black text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    포트폴리오
                  </button>
                )}

                {application.portfolio_type === 'link' && application.portfolio_link && (
                  <a
                    href={application.portfolio_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-800 border-b-2 border-transparent hover:border-blue-600"
                  >
                    포트폴리오 링크 ↗
                  </a>
                )}
              </div>
            </div>

            {/* PDF 뷰어 */}
            <div className="h-[calc(100vh-350px)] min-h-[600px]">
              {getCurrentPdfUrl() ? (
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                  <Viewer
                    fileUrl={getCurrentPdfUrl()!}
                    plugins={[defaultLayoutPluginInstance]}
                  />
                </Worker>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>파일이 없습니다</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail; 