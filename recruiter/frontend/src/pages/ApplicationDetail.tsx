import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import type { ApplicationStatus } from '../../../../shared/types';
import { getDepartmentColor } from '../../../../shared/utils';
import { useAuthStore } from '../store/authStore';
import { useDashboardStore } from '../store/dashboardStore';

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canChangeApplicationStatus } = useAuthStore();
  const {
    applications,
    getApplicationById,
    getJobById,
    updateApplicationStatus,
    getStatusText,
    getStatusColor,
    fetchJobs,
    fetchApplications
  } = useDashboardStore();

  const application = id ? getApplicationById(parseInt(id)) : null;
  const job = application ? getJobById(application.job_id) : null;
  const [activeTab, setActiveTab] = useState<'resume' | 'portfolio'>('resume');

  // 🚀 컴포넌트 마운트 시 데이터 확인 및 로딩
  useEffect(() => {
    if (!applications.length) {
      // 스토어에 데이터가 없으면 다시 로딩
      fetchJobs();
    }
    
    if (application && !job) {
      // job 데이터가 없으면 해당 job의 applications 로딩
      fetchApplications(application.job_id);
    }
  }, [id, application, job, applications.length, fetchJobs, fetchApplications]);

  // ⚡ 상태 변경 핸들러 (이메일/슬랙 알림 포함)
  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!application) return;

    try {
      await updateApplicationStatus(application.id, newStatus);
      console.log('✅ 상태 변경 완료!');
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
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

  const getCurrentPdfUrl = () => {
    if (activeTab === 'resume') return application?.resume_file_url;
    if (activeTab === 'portfolio') return application?.portfolio_file_url;
    return null;
  };

  // Default layout plugin instance
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // 🔄 로딩 중이거나 데이터가 없는 경우
  if (!application || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {!id ? (
            <p className="text-gray-600">잘못된 지원서 ID입니다.</p>
          ) : applications.length === 0 ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">지원서 로딩 중...</p>
            </>
          ) : (
            <p className="text-gray-600">지원서를 찾을 수 없습니다.</p>
          )}
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
                <h1 className="text-xl font-bold text-gray-900">지원서 상세</h1>
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
            <div className="text-center mb-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">{application.name}</h2>
                {application.english_name && (
                  <p className="text-gray-600 mt-1">{application.english_name}</p>
                )}
              </div>
              
              {/* 상태 뱃지 */}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                {getStatusText(application.status)}
              </span>
            </div>

            {/* 기본 정보 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">연락처</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <span className="inline-block w-12">이메일</span>
                    <span className="text-gray-900">{application.email}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="inline-block w-12">전화</span>
                    <span className="text-gray-900">{application.phone}</span>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">지원 정보</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    <span className="inline-block w-16">직책</span>
                    <span className="text-gray-900">{job.title}</span>
                  </p>
                  <p className="text-gray-600">
                    <span className="inline-block w-16">부서</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getDepartmentColor(job.department)}`}>
                      {job.department}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    <span className="inline-block w-16">경력</span>
                    <span className="text-gray-900">{job.experience}</span>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">지원 경로</h3>
                <p className="text-sm text-gray-600">{application.referral_source}</p>
              </div>

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
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('resume')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'resume' 
                      ? 'border-black text-black bg-white' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  이력서
                </button>
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'portfolio' 
                      ? 'border-black text-black bg-white' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  포트폴리오
                </button>
              </div>
            </div>

            {/* PDF 컨테이너 */}
            <div className="h-[600px] xl:h-[800px] overflow-auto">
              {getCurrentPdfUrl() ? (
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                  <div className="h-full">
                    <Viewer
                      fileUrl={getCurrentPdfUrl()!}
                      plugins={[defaultLayoutPluginInstance]}
                    />
                  </div>
                </Worker>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>{activeTab === 'resume' ? '이력서' : '포트폴리오'}가 업로드되지 않았습니다.</p>
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