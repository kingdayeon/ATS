import { STATUS_MAP } from '../../../../../shared/constants';
import type { ApplicationStatus, FinalStatus } from '../../../../../shared/types';

interface StatusBadgeProps {
  status: ApplicationStatus | FinalStatus | 'evaluated' | 'not_evaluated';
  customText?: string;
  customClassName?: string;
}

const StatusBadge = ({ status, customText, customClassName }: StatusBadgeProps) => {
  // 커스텀 텍스트와 클래스가 제공된 경우 사용
  if (customText && customClassName) {
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${customClassName}`}
      >
        {customText}
      </span>
    );
  }

  // 기존 로직
  const style = STATUS_MAP[status];

  if (!style || style.className === 'hidden') {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${style.className}`}
    >
      {style.text}
    </span>
  );
};

export default StatusBadge; 