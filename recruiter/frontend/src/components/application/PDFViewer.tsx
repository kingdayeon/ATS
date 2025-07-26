import { useState } from 'react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import type { Application } from '../../../../../shared/types';

interface PDFViewerProps {
  application: Application;
}

const PDFViewer = ({ application }: PDFViewerProps) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'portfolio'>('resume');

  const getCurrentPdfUrl = () => {
    if (activeTab === 'resume') return application.resume_file_url;
    if (activeTab === 'portfolio') return application.portfolio_file_url;
    return null;
  };

  return (
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
                theme={{
                  theme: 'light',
                }}
                defaultScale={SpecialZoomLevel.PageWidth}
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
  );
};

export default PDFViewer; 