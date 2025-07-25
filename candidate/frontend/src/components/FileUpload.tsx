import { Upload } from "lucide-react";
import type { FileUploadProps } from "@/types";

const FileUpload = ({ 
  title, 
  description, 
  isRequired = false, 
  acceptedTypes = ".pdf",
  selectedFile,
  onFileSelect 
}: FileUploadProps) => {
  return (
    <div className="mb-8">
      {title && (
        <h3 className="font-medium mb-4">
          {title} {isRequired && <span className="text-red-500">필수</span>}
        </h3>
      )}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-700 mb-2 font-medium">이곳에 파일을 올려주세요</p>
        <p className="text-sm text-gray-500 mb-6">{description}</p>
        
        <label className="inline-flex items-center px-6 py-2 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
          <span className="text-sm font-medium text-gray-700">파일 선택</span>
          <input
            type="file"
            accept={acceptedTypes}
            onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
            className="hidden"
            required={isRequired}
          />
        </label>
        
        {selectedFile && (
          <p className="text-sm text-green-600 mt-3">
            선택된 파일: {selectedFile.name}
          </p>
        )}
      </div>
    </div>
  );
};

export default FileUpload; 