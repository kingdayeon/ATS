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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 lg:flex-1 lg:min-h-0 pb-4">
      <StatusColumn
        title="지원 접수"
        statusKey="submitted"
        items={getApplicationsByStatus('submitted')}
        emptyText="지원자가 없습니다"
        selectedJob={selectedJob || undefined}
        onStatusChange={onStatusChange}
      />
      
      <StatusColumn
        title="면접 진행"
        statusKey="interview"
        items={getApplicationsByStatus('interview')}
        emptyText="면접 예정인 지원자가 없습니다"
        selectedJob={selectedJob || undefined}
        onStatusChange={onStatusChange}
      />

      <StatusColumn
        title="입사 제안"
        statusKey="accepted"
        items={getApplicationsByStatus('accepted')}
        emptyText="입사 제안한 지원자가 없습니다"
        selectedJob={selectedJob || undefined}
        onStatusChange={onStatusChange}
      />

      <StatusColumn
        title="최종 결과"
        statusKey="final" // 이 키는 dnd에 사용되므로 고유해야 함
        // 'hired' 와 'offer_declined' 상태의 지원자를 모두 가져옴
        items={[
          ...getApplicationsByFinalStatus('hired'),
          ...getApplicationsByFinalStatus('offer_declined'),
          ...getApplicationsByFinalStatus('rejected'),
        ]}
        emptyText="최종 결정된 지원자가 없습니다"
        selectedJob={selectedJob || undefined}
        onStatusChange={onStatusChange}
      />
    </div>
  );
};

export default DashboardGrid; 