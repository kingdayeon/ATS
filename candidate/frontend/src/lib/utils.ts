// 간단한 className 병합 함수 (패키지 의존성 제거)
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
} 