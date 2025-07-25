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

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <main className="flex-1">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-6 p-0 h-auto text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>

            {/* Job Title */}
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                {job.title}
              </h1>
            </header>

            {/* Job Sections */}
            <div className="space-y-8">
              {/* Company Description */}
              {job.description && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">[{job.company} 소개]</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {job.description}
                  </p>
                </section>
              )}

              {/* Team Introduction */}
              {job.teamIntro && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">[팀 소개]</h2>
                  <p className="text-gray-600 leading-relaxed">
                    {job.teamIntro}
                  </p>
                </section>
              )}

              {/* Responsibilities */}
              {job.responsibilities && job.responsibilities.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">[담당 업무]</h2>
                  <ul className="space-y-2">
                    {job.responsibilities.map((responsibility, index) => (
                      <li key={index} className="text-gray-600 flex items-start">
                        <span className="mr-2 text-gray-400">•</span>
                        <span>{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Requirements */}
              {job.requirements && (
                <section>
                  <h2 className="text-xl font-semibold mb-4">[자격 요건]</h2>
                  <p className="text-gray-600">• {job.requirements}</p>
                </section>
              )}
            </div>
          </main>

          {/* Sidebar */}
          <aside className="w-80 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 sticky top-8">
              {/* Job Information */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">구분</div>
                  <div className="font-medium">{job.company}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">직군</div>
                  <div className="font-medium">{job.department}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">경력사항</div>
                  <div className="font-medium">{job.experience}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">고용형태</div>
                  <div className="font-medium">{job.type}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">근무지</div>
                  <div className="font-medium">{job.location}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    서울특별시 성동구 성수동2가 271-22, 무신사 성수 (E1)
                  </div>
                </div>
              </div>
              
              {/* Map placeholder */}
              <div className="bg-gray-100 rounded-lg h-40 mb-6 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer">
                <MapPin className="h-6 w-6 mr-2" />
                지도 영역
              </div>
              
              {/* Apply Button */}
              <Button 
                onClick={handleApply}
                className="w-full bg-black text-white hover:bg-gray-800 h-12 text-base font-medium"
              >
                지원하기
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default JobDetail; 