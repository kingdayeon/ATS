import type { Application, Job, ApplicationStatus, FinalStatus } from '../../../../../shared/types';
import StatusColumn from '../ui/StatusColumn';

interface DashboardGridProps {
  getApplicationsByStatus: (status: ApplicationStatus) => Application[];
  getApplicationsByFinalStatus: (finalStatus: FinalStatus) => Application[]; // 추가
  selectedJob: Job | null;
  onStatusChange: (applicationId: number, newStatus: string) => Promise<void>;
}

const DashboardGrid = ({ 
  getApplicationsByStatus, 
  getApplicationsByFinalStatus, // 추가
  selectedJob, 
  onStatusChange 
}: DashboardGridProps) => {
  // 헬퍼 함수: 날짜 내림차순으로 정렬
  const sortApplications = (applications: Application[]) => {
    return applications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 lg:flex-1 lg:min-h-0 pb-4">
      <StatusColumn
        title="지원 접수"
        statusKey="submitted"
        items={sortApplications(getApplicationsByStatus('submitted'))}
        emptyText="지원자가 없습니다"
        selectedJob={selectedJob || undefined}
        onStatusChange={onStatusChange}
      />
      
      <StatusColumn
        title="면접 진행"
        statusKey="interview"
        items={sortApplications(getApplicationsByStatus('interview'))}
        emptyText="면접 예정인 지원자가 없습니다"
        selectedJob={selectedJob || undefined}
        onStatusChange={onStatusChange}
      />
      
      <StatusColumn
        title="입사 제안"
        statusKey="accepted"
        items={sortApplications(getApplicationsByStatus('accepted'))}
        emptyText="입사 제안한 지원자가 없습니다"
        selectedJob={selectedJob || undefined}
        onStatusChange={onStatusChange}
      />

      <StatusColumn
        title="최종 결과"
        statusKey="final"
        items={sortApplications([
          ...getApplicationsByFinalStatus('hired'),
          ...getApplicationsByFinalStatus('offer_declined'),
          // 'rejected' 상태는 여기서 더 이상 보여주지 않음
        ])}
        emptyText="최종 결정된 지원자가 없습니다"
        selectedJob={selectedJob || undefined}
        onStatusChange={onStatusChange}
      />
    </div>
  );
};

export default DashboardGrid; 