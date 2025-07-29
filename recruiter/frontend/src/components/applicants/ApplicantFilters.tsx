import { useApplicantStore } from '../../store/applicantStore';
import type { SortOption } from '../../store/applicantStore';
import CustomDropdown from '../ui/CustomDropdown';
import { Search } from 'lucide-react';
import { STATUS_MAP } from '../../../../../shared/constants'; // 상수 import
import type { ApplicationStatus, FinalStatus } from '../../../../../shared/types';

const ApplicantFilters = () => {
  const {
    searchTerm, setSearchTerm,
    selectedJobId, setSelectedJobId, getAvailableJobs,
    selectedStatuses, toggleStatusFilter,
    sortOption, setSortOption,
    filterMyUnevaluated, toggleMyUnevaluatedFilter,
  } = useApplicantStore();

  const availableJobs = getAvailableJobs();
  const jobOptions = [{ value: 'all', label: '모든 직무' }, ...availableJobs.map(j => ({ value: j.id, label: j.title }))];
  const sortOptions = [
    { value: 'latest', label: '최신 순' },
    { value: 'oldest', label: '오래된 순' },
    { value: 'name_asc', label: '이름순' },
    { value: 'status_asc', label: '상태순' },
    { value: 'score_desc', label: '평균 높은 순' },
    { value: 'score_asc', label: '평균 낮은 순' },
  ];
  const allStatuses = Object.keys(STATUS_MAP).filter(s => s !== 'pending') as (ApplicationStatus | FinalStatus)[];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <CustomDropdown
          options={jobOptions}
          value={selectedJobId}
          onChange={(val) => setSelectedJobId(val as 'all' | number)}
        />
        <CustomDropdown
          options={sortOptions}
          value={sortOption}
          onChange={(val) => setSortOption(val as SortOption)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {allStatuses.map(status => (
          <button
            key={status}
            onClick={() => toggleStatusFilter(status)}
            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
              selectedStatuses.includes(status)
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {STATUS_MAP[status]?.text || status}
          </button>
        ))}
        
        {/* '미평가' 버튼 추가 */}
        <button
          onClick={toggleMyUnevaluatedFilter}
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
            filterMyUnevaluated
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          미평가
        </button>
      </div>
    </div>
  );
};

export default ApplicantFilters; 