import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Filter, X, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import CheckboxFilter from "@/components/CheckboxFilter";
import { jobListings } from "@/data/mockJobs";
import type { CompanyType, JobListFilters } from "@/types";
import { COMPANIES, DEPARTMENTS } from "@/types";

const Index = () => {
  const [filters, setFilters] = useState<JobListFilters>({
    searchQuery: "",
    selectedCompanies: [],
    selectedDepartments: []
  });

  const [isCompanyExpanded, setIsCompanyExpanded] = useState(true);
  const [isDepartmentExpanded, setIsDepartmentExpanded] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const filteredJobs = useMemo(() => {
    return jobListings.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(filters.searchQuery.toLowerCase());
      const matchesCompany = filters.selectedCompanies.length === 0 ||
        filters.selectedCompanies.includes(job.company);
      const matchesDepartment = filters.selectedDepartments.length === 0 ||
        filters.selectedDepartments.includes(job.department);

      return matchesSearch && matchesCompany && matchesDepartment;
    });
  }, [filters.searchQuery, filters.selectedCompanies, filters.selectedDepartments]);

  const handleSearchChange = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  const handleCompanyChange = (company: string, checked: boolean) => {
    const companyType = company as CompanyType;
    setFilters(prev => ({
      ...prev,
      selectedCompanies: checked
        ? [...prev.selectedCompanies, companyType]
        : prev.selectedCompanies.filter(c => c !== companyType)
    }));
  };

  const handleDepartmentChange = (department: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      selectedDepartments: checked
        ? [...prev.selectedDepartments, department]
        : prev.selectedDepartments.filter(d => d !== department)
    }));
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: "",
      selectedCompanies: [],
      selectedDepartments: []
    });
  };

  const activeFilterCount = filters.selectedCompanies.length + filters.selectedDepartments.length;

  // Shared styles with Tailwind CSS classes
  const cardStyles = "block border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200";
  const badgeStyles = "text-gray-600 bg-gray-100 text-xs md:text-sm";
  const buttonPrimaryStyles = "bg-black text-white hover:bg-gray-800";

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <CheckboxFilter
              title="구분"
              options={COMPANIES}
              selectedOptions={filters.selectedCompanies}
              onOptionChange={handleCompanyChange}
              isExpanded={isCompanyExpanded}
              onToggleExpanded={() => setIsCompanyExpanded(!isCompanyExpanded)}
            />

            <CheckboxFilter
              title="직군"
              options={DEPARTMENTS}
              selectedOptions={filters.selectedDepartments}
              onOptionChange={handleDepartmentChange}
              isExpanded={isDepartmentExpanded}
              onToggleExpanded={() => setIsDepartmentExpanded(!isDepartmentExpanded)}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search Bar with Filter Button */}
            <div className="flex gap-2 mb-6 md:mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="검색"
                  value={filters.searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Mobile Filter Button */}
              <Button
                variant="outline"
                onClick={() => setIsMobileFilterOpen(true)}
                className="md:hidden flex-shrink-0 px-4 relative"
              >
                <Filter className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Results Count */}
            <div className="mb-4 md:mb-6">
              <p className="text-gray-600 text-sm md:text-base">
                총 <span className="font-semibold text-black">{filteredJobs.length}</span>개의 공고
              </p>
            </div>

            {/* Job Listings */}
            <div className="space-y-4 md:space-y-6">
              {filteredJobs.map((job) => (
                <article key={job.id}>
                  <Link to={`/job/${job.id}`} className={cardStyles}>
                    <h3 className="text-lg md:text-xl font-bold text-black mb-3 md:mb-4 hover:text-gray-800 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[job.company, job.department, job.experience, job.type, job.location].map((item, index) => (
                        <Badge key={index} variant="secondary" className={badgeStyles}>
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* No Results */}
            {filteredJobs.length === 0 && (
              <div className="text-center py-12 md:py-16">
                <Search className="h-8 w-8 md:h-12 md:w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-base md:text-lg font-medium text-gray-600 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-sm md:text-base text-gray-500 mb-4">
                  다른 검색어나 필터를 시도해보세요
                </p>
                <Button onClick={resetFilters} variant="outline" size="sm">
                  필터 초기화
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Modal - Full Screen */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-white">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <h2 className="text-lg font-semibold">필터</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={resetFilters}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  초기화
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Filter Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-8">
                <CheckboxFilter
                  title="구분"
                  options={COMPANIES}
                  selectedOptions={filters.selectedCompanies}
                  onOptionChange={handleCompanyChange}
                  isExpanded={isCompanyExpanded}
                  onToggleExpanded={() => setIsCompanyExpanded(!isCompanyExpanded)}
                />

                <CheckboxFilter
                  title="직군"
                  options={DEPARTMENTS}
                  selectedOptions={filters.selectedDepartments}
                  onOptionChange={handleDepartmentChange}
                  isExpanded={isDepartmentExpanded}
                  onToggleExpanded={() => setIsDepartmentExpanded(!isDepartmentExpanded)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 bg-white">
              <Button
                onClick={() => setIsMobileFilterOpen(false)}
                className={`w-full h-12 text-base font-medium ${buttonPrimaryStyles}`}
              >
                적용하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index; 