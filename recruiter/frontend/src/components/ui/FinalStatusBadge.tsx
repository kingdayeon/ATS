import React from 'react';

type FinalStatus = 'hired' | 'offer_declined' | 'rejected' | 'pending';

interface FinalStatusBadgeProps {
  status: FinalStatus;
}

const statusStyles: Record<FinalStatus, { text: string; className: string }> = {
  hired: {
    text: '입사 결정',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  offer_declined: {
    text: '입사 취소',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  rejected: {
    text: '불합격',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  pending: {
    text: '',
    className: 'hidden', // pending 상태일 때는 뱃지를 표시하지 않음
  },
};

const FinalStatusBadge: React.FC<FinalStatusBadgeProps> = ({ status }) => {
  if (status === 'pending') {
    return null;
  }

  const { text, className } = statusStyles[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}
    >
      {text}
    </span>
  );
};

export default FinalStatusBadge; 