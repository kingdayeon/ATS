import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
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

  // Memoized filtered jobs for better performance
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

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className="w-64 flex-shrink-0">
            {/* Company Filter */}
            <CheckboxFilter
              title="구분"
              options={COMPANIES}
              selectedOptions={filters.selectedCompanies}
              onOptionChange={handleCompanyChange}
              isExpanded={isCompanyExpanded}
              onToggleExpanded={() => setIsCompanyExpanded(!isCompanyExpanded)}
            />

            {/* Department Filter */}
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
          <main className="flex-1">
            {/* Search Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="검색"
                value={filters.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Results Summary */}
            <div className="mb-6">
              <p className="text-gray-600">
                총 <span className="font-semibold text-black">{filteredJobs.length}</span>개의 공고
              </p>
            </div>

            {/* Job Listings */}
            <div className="space-y-6">
              {filteredJobs.map((job) => (
                <article key={job.id}>
                  <Link 
                    to={`/job/${job.id}`}
                    className="block border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                  >
                    <h3 className="text-xl font-bold text-black mb-4 hover:text-gray-800 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-gray-600 bg-gray-100">
                        {job.company}
                      </Badge>
                      <Badge variant="secondary" className="text-gray-600 bg-gray-100">
                        {job.department}
                      </Badge>
                      <Badge variant="secondary" className="text-gray-600 bg-gray-100">
                        {job.experience}
                      </Badge>
                      <Badge variant="secondary" className="text-gray-600 bg-gray-100">
                        {job.type}
                      </Badge>
                      <Badge variant="secondary" className="text-gray-600 bg-gray-100">
                        {job.location}
                      </Badge>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* No Results State */}
            {filteredJobs.length === 0 && (
              <div className="text-center py-16">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  검색 결과가 없습니다
                </h3>
                <p className="text-gray-500 mb-4">
                  다른 검색어나 필터를 시도해보세요
                </p>
                <Button onClick={resetFilters} variant="outline">
                  필터 초기화
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index; 