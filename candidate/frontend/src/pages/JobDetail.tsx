import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useJob } from "@/hooks/useJob";
import type { Job } from "@/types";

const JobDetail = () => {
  const navigate = useNavigate();
  const job: Job = useJob();

  const handleApply = () => {
    navigate(`/apply/${job.id}`);
  };

  // Shared styles with Tailwind CSS classes
  const sectionStyles = "mb-6 md:mb-8";
  const headingStyles = "text-lg md:text-xl font-semibold mb-3 md:mb-4";
  const textStyles = "text-gray-600 leading-relaxed text-sm md:text-base";
  const buttonPrimaryStyles = "bg-black text-white hover:bg-gray-800";

  // Job info items for mapping
  const jobInfoItems = [
    { label: "구분", value: job.company },
    { label: "직군", value: job.department },
    { label: "경력사항", value: job.experience },
    { label: "고용형태", value: job.type },
    { 
      label: "근무지", 
      value: job.location,
      subValue: "서울특별시 성동구 성수동2가 271-22, 무신사 성수 (E1)"
    }
  ];

  // Content sections for mapping
  const contentSections = [
    {
      title: `[${job.company} 소개]`,
      content: job.description,
      show: !!job.description
    },
    {
      title: "[팀 소개]",
      content: job.teamIntro,
      show: !!job.teamIntro
    },
    {
      title: "[담당 업무]",
      content: job.responsibilities,
      show: !!job.responsibilities?.length,
      isList: true
    },
    {
      title: "[자격 요건]",
      content: job.requirements,
      show: !!job.requirements,
      prefix: "• "
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4 md:mb-6 p-0 h-auto text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>

            {/* Job Title */}
            <header className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
                {job.title}
              </h1>
            </header>

            {/* Mobile Job Info */}
            <div className="md:hidden mb-6">
              <div className="space-y-3">
                {jobInfoItems.map((item, index) => (
                  <div key={index}>
                    <div className="text-xs text-gray-600 mb-1">{item.label}</div>
                    <div className="font-medium text-sm">{item.value}</div>
                    {item.subValue && (
                      <div className="text-xs text-gray-500 mt-1">{item.subValue}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-6 md:space-y-8 pb-20 md:pb-0">
              {contentSections.map((section, index) => (
                section.show && (
                  <section key={index} className={sectionStyles}>
                    <h2 className={headingStyles}>{section.title}</h2>
                    {section.isList && Array.isArray(section.content) ? (
                      <ul className="space-y-2">
                        {section.content.map((item, itemIndex) => (
                          <li key={itemIndex} className={`${textStyles} flex items-start`}>
                            <span className="mr-2 text-gray-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : section.title === "[자격 요건]" ? (
                      <div className={textStyles}>
                        {typeof section.content === 'string' && section.content.split('\n').map((line: string, lineIndex: number) => (
                          line.trim() && (
                            <div key={lineIndex} className="mb-2">
                              {line.trim()}
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      <p className={textStyles}>
                        {section.prefix}{section.content}
                      </p>
                    )}
                  </section>
                )
              ))}
            </div>
          </main>

          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-80 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 sticky top-8">
              {/* Job Information */}
              <div className="space-y-4 mb-6">
                {jobInfoItems.map((item, index) => (
                  <div key={index}>
                    <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                    <div className="font-medium">{item.value}</div>
                    {item.subValue && (
                      <div className="text-sm text-gray-500 mt-1">{item.subValue}</div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Map placeholder */}
              <div className="bg-gray-100 rounded-lg h-40 mb-6 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer">
                <MapPin className="h-6 w-6 mr-2" />
                지도 영역
              </div>
              
              {/* Desktop Apply Button */}
              <Button 
                onClick={handleApply}
                className={`w-full h-12 text-base font-medium ${buttonPrimaryStyles}`}
              >
                지원하기
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Fixed Bottom Apply Button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-pb">
        <Button
          onClick={handleApply}
          className={`w-full h-12 text-base font-medium ${buttonPrimaryStyles}`}
        >
          지원하기
        </Button>
      </div>
    </div>
  );
};

export default JobDetail; 