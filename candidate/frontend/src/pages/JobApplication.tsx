import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import { useJob } from "@/hooks/useJob";
import type { ApplicationFormData, ReferralSource } from "@/types";
import { REFERRAL_OPTIONS } from "@/types";

const JobApplication = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Get job details using custom hook
  const job = useJob();

  const [formData, setFormData] = useState<ApplicationFormData>({
    name: "",
    email: "",
    phone: "",
    englishName: "",
    resumeFile: null,
    portfolioType: "file",
    portfolioFile: null,
    portfolioLink: "",
    referralSource: "",
    customReferral: "",
    allConsent: false,
    requiredConsent: false,
    optionalConsent: false,
  });

  const handleInputChange = <K extends keyof ApplicationFormData>(
    field: K, 
    value: ApplicationFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAllConsentChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      allConsent: checked,
      requiredConsent: checked,
      optionalConsent: checked,
    }));
  };

  const handleFileUpload = (field: "resumeFile" | "portfolioFile", file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleReferralSourceChange = (source: ReferralSource) => {
    setFormData(prev => ({ 
      ...prev, 
      referralSource: source,
      customReferral: source === "직접 입력" ? prev.customReferral : ""
    }));
  };

  const validateForm = (): boolean => {
    const { name, email, englishName, resumeFile, referralSource, requiredConsent } = formData;
    
    if (!name || !email || !englishName || !resumeFile || !referralSource || !requiredConsent) {
      alert("필수 항목을 모두 입력해주세요");
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("올바른 이메일 형식을 입력해주세요");
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // TODO: API call to submit application
    console.log("Submitting application:", formData);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">지원서가 제출되었습니다!</h1>
          <p className="text-gray-600 mb-6">검토 후 연락드리겠습니다.</p>
          <Button onClick={() => navigate("/")}>
            채용 공고 목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/job/${id}`)}
          className="mb-6 p-0 h-auto text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
        </Button>

        {/* Page Title */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">지원서 작성하기</h1>
          <p className="text-gray-600">{job.title}</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 지원자 정보 */}
          <section>
            <h2 className="text-xl font-semibold mb-6">지원자 정보</h2>
            
            {/* 기본 정보 */}
            <div className="mb-6">
              <h3 className="font-medium mb-4">
                기본 정보 <span className="text-red-500">필수</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="mt-1"
                    placeholder="이름을 입력해주세요"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="mt-1"
                    placeholder="example@email.com"
                  />
                  <div className="text-right mt-1">
                    <span className="text-xs text-blue-500 cursor-pointer">이메일 확인</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">전화번호('-' 없이 입력해 주세요)</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="01012345678"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* 영문 이름 */}
            <div className="mb-6">
              <h3 className="font-medium mb-4">
                영문 이름 <span className="text-red-500">필수</span>
              </h3>
              <Input
                value={formData.englishName}
                onChange={(e) => handleInputChange("englishName", e.target.value)}
                placeholder="영문 이름을 입력해주세요"
                required
              />
            </div>
          </section>

          {/* 제출 서류 */}
          <section>
            <h2 className="text-xl font-semibold mb-6">제출 서류</h2>
            
            {/* 이력서 */}
            <FileUpload
              title="이력서"
              description="* PDF 형식으로 제출해 주세요."
              isRequired={true}
              selectedFile={formData.resumeFile}
              onFileSelect={(file) => handleFileUpload("resumeFile", file)}
            />

            {/* 포트폴리오 */}
            <div className="mb-8">
              <h3 className="font-medium mb-4">포트폴리오</h3>
              
              {/* 파일/링크 선택 */}
              <div className="flex gap-8 mb-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="file"
                    checked={formData.portfolioType === "file"}
                    onChange={() => handleInputChange("portfolioType", "file")}
                    id="portfolio-file"
                  />
                  <Label htmlFor="portfolio-file" className="font-normal cursor-pointer">파일</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="link"
                    checked={formData.portfolioType === "link"}
                    onChange={() => handleInputChange("portfolioType", "link")}
                    id="portfolio-link"
                  />
                  <Label htmlFor="portfolio-link" className="font-normal cursor-pointer">링크</Label>
                </div>
              </div>

              {formData.portfolioType === "file" ? (
                <FileUpload
                  title=""
                  description="* PDF 형식 또는 링크로 제출해주세요. (링크 제출 시, 접근 권한 확인 부탁드립니다.)"
                  selectedFile={formData.portfolioFile}
                  onFileSelect={(file) => handleFileUpload("portfolioFile", file)}
                />
              ) : (
                <div className="space-y-4">
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={formData.portfolioLink}
                    onChange={(e) => handleInputChange("portfolioLink", e.target.value)}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500">
                    * PDF 형식 또는 링크로 제출해주세요. (링크 제출 시, 접근 권한 확인 부탁드립니다.)
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 사전 질문 */}
          <section>
            <h2 className="text-xl font-semibold mb-6">사전 질문</h2>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">
                해당 공고를 처음 접한 경로를 선택해주세요. <span className="text-red-500">필수</span>
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                지원자분들께서 어떤 경로로 공고를 접하셨는지 파악하기 위한 용도로만 사용되니, 부담 없이 편하게 선택해 주세요!
              </p>
              
              <div className="space-y-3">
                {REFERRAL_OPTIONS.map((option) => (
                  <div key={option} className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value={option} 
                      id={`referral-${option}`}
                      checked={formData.referralSource === option}
                      onChange={() => handleReferralSourceChange(option)}
                    />
                    <Label htmlFor={`referral-${option}`} className="font-normal cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>

              {formData.referralSource === "직접 입력" && (
                <Input
                  className="mt-4"
                  placeholder="직접 입력해주세요"
                  value={formData.customReferral}
                  onChange={(e) => handleInputChange("customReferral", e.target.value)}
                />
              )}
            </div>
          </section>

          {/* 개인정보 동의 */}
          <section>
            <h2 className="text-xl font-semibold mb-6">지원을 위해 다음 사항을 확인해 주세요.</h2>
            
            <div className="space-y-4">
              {/* 전체 동의 */}
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="all-consent"
                  checked={formData.allConsent}
                  onCheckedChange={handleAllConsentChange}
                />
                <Label htmlFor="all-consent" className="font-medium cursor-pointer">전체 동의</Label>
              </div>

              {/* 필수 동의 */}
              <div className="flex items-start space-x-3 ml-6">
                <Checkbox
                  id="required-consent"
                  checked={formData.requiredConsent}
                  onCheckedChange={(checked) => {
                    handleInputChange("requiredConsent", !!checked);
                    if (!checked) handleInputChange("allConsent", false);
                  }}
                  required
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="required-consent" className="font-normal cursor-pointer">
                    개인정보 필수항목 수집 및 이용 동의
                  </Label>
                  <span className="text-red-500 text-sm">필수</span>
                  <button type="button" className="text-gray-400 text-sm hover:text-gray-600">▼</button>
                </div>
              </div>

              {/* 선택 동의 */}
              <div className="flex items-start space-x-3 ml-6">
                <Checkbox
                  id="optional-consent"
                  checked={formData.optionalConsent}
                  onCheckedChange={(checked) => {
                    handleInputChange("optionalConsent", !!checked);
                    if (!checked) handleInputChange("allConsent", false);
                  }}
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="optional-consent" className="font-normal cursor-pointer">
                    개인정보 선택항목 수집 및 이용 동의
                  </Label>
                  <span className="text-blue-500 text-sm">선택</span>
                  <button type="button" className="text-gray-400 text-sm hover:text-gray-600">▼</button>
                </div>
              </div>
            </div>
          </section>

          {/* 제출 버튼 */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              className="w-full max-w-md px-12 py-4 bg-black text-white hover:bg-gray-800 text-lg"
              disabled={!formData.requiredConsent}
            >
              제출하기
            </Button>
          </div>
        </form>

        {/* 문의 안내 */}
        <footer className="text-center mt-8 space-y-2">
          <p className="text-sm text-gray-600">
            지원서 제출 과정에서 문제가 발생하였다면{" "}
            <a href="#" className="text-blue-500 underline hover:text-blue-600">
              여기
            </a>
            로 문의해 주세요!
          </p>
          <p className="text-xs text-gray-500">
            채용 관리 솔루션 그리팅(Greeting)의 고객센터로 연결됩니다.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default JobApplication; 