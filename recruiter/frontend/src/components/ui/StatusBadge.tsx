import { STATUS_MAP } from '../../../../../shared/constants';
import type { ApplicationStatus, FinalStatus } from '../../../../../shared/types';

interface StatusBadgeProps {
  status: ApplicationStatus | FinalStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const style = STATUS_MAP[status];

  if (!style || style.className === 'hidden') {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.className}`}
    >
      {style.text}
    </span>
  );
};

export default StatusBadge; 