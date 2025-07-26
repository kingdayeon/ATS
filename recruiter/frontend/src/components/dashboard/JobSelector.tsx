import type { Job } from '../../../../../shared/types';

interface JobSelectorProps {
  selectedJob?: Job | null;
}

const JobSelector = ({ selectedJob }: JobSelectorProps) => {
  // 선택된 채용공고가 없으면 렌더링하지 않음
  if (!selectedJob) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
      </div>
      <p className="text-gray-600">
        {selectedJob.company} · {selectedJob.experience} · {selectedJob.location}
      </p>
    </div>
  );
};

export default JobSelector; 