import { useState } from 'react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import type { Application } from '../../../../../shared/types';
import { Link, ExternalLink } from 'lucide-react';

interface PDFViewerProps {
  application: Application;
}

const PDFViewer = ({ application }: PDFViewerProps) => {
  const [activeTab, setActiveTab] = useState<'resume' | 'portfolio'>('resume');

  const renderPortfolioContent = () => {
    if (application.portfolio_file_url) {
      return <Viewer fileUrl={application.portfolio_file_url} defaultScale={SpecialZoomLevel.PageWidth} />;
    }
    if (application.portfolio_link) {
      return (
        <div className="h-full flex items-center justify-center text-gray-600 bg-gray-50">
          <div className="text-center p-8">
            <ExternalLink className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">포트폴리오 링크</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md break-all">
              아래 버튼을 클릭하여 새 탭에서 지원자의 포트폴리오를 확인하세요.
            </p>
            <a
              href={application.portfolio_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800"
            >
              새 탭에서 열기
              <ExternalLink className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      );
    }
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Link className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>포트폴리오가 업로드되지 않았습니다.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* 탭 헤더 */}
      <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
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

      {/* 컨텐츠 영역 (내부 스크롤 활성화) */}
      <div className="flex-1 overflow-y-auto">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
          {activeTab === 'resume' &&
            (application.resume_file_url ? (
              <Viewer fileUrl={application.resume_file_url} defaultScale={SpecialZoomLevel.PageWidth} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p>이력서가 없습니다.</p>
              </div>
            ))}
          {activeTab === 'portfolio' && renderPortfolioContent()}
        </Worker>
      </div>
    </div>
  );
};

export default PDFViewer; 