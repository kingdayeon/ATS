interface ErrorDisplayProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
}

const ErrorDisplay = ({ 
  message, 
  onRetry, 
  retryText = '새로고침' 
}: ErrorDisplayProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 mb-4">{message}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay; 