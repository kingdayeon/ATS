import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ApplicationHeaderProps {
  applicantName: string;
}

const ApplicationHeader = ({ applicantName }: ApplicationHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black flex items-center justify-center rounded-md">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <h1 className="text-lg font-bold text-gray-800">
              지원서 상세 - {applicantName}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationHeader; 