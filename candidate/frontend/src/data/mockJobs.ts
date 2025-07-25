import type { Job, MockJobData } from "@/types";

// Mock job listings data
export const jobListings: Job[] = [
  {
    id: 1,
    title: "Backend Engineer (29CM/서치앤디스커버리)",
    company: "29CM",
    department: "Backend Engineer",
    experience: "경력 7년 이상",
    type: "정규직",
    location: "무신사 오피스 성수",
    description: "29CM은 고객의 라이프 스타일에 어울리는 최적의 상품을 발견하고 소개하는 온/오프라인 셀렉트샵입니다. 2011년, '고객의 더 나은 선택을 돕는다'라는 미션으로부터 출발한 후, 2024년 거래액 1조를 돌파했으며, 매년 두 자릿수의 성장률을 지속하며 고속 성장 중입니다.",
    teamIntro: "29CM에 Customer Engagement Engineering 실에는 Search & Discovery 팀과 Campaign & Content 팀이 있으며, 고객이 29CM 가치를 발견하고 탐색할 수 있는 경험을 제공하는 핵심 조직입니다.",
    responsibilities: [
      "전반적인 전시/콘텐츠 영역을 책임지며, 대규모 트래픽을 안정적으로 처리하고 고객에게 최적의 콘텐츠를 제공합니다.",
      "고객의 발견 경험을 구성하는 설득하기, 즐기기, 채워넣기, 레어 등의 기능을 설계하고 개발합니다.",
      "고객이 상품을 찾고 발견하는 탐색 여정을 돕기 위해 프론트엔드와 모바일이 최적화된 BFF API를 개발합니다."
    ],
    requirements: "7년 이상의 개발 경험이 있으신 분 혹은 그에 준하는 역량을 갖추신 분"
  },
  {
    id: 2,
    title: "Backend Engineer (29CM/세일프라이싱)",
    company: "29CM",
    department: "Backend Engineer",
    experience: "경력 7년 이상",
    type: "정규직",
    location: "무신사 오피스 성수"
  },
  {
    id: 3,
    title: "Backend Engineer (Core Catalog)",
    company: "무신사",
    department: "Backend Engineer",
    experience: "경력 5년 이상",
    type: "정규직",
    location: "무신사 오피스 성수"
  },
  {
    id: 4,
    title: "Backend Engineer (Platform Business Operation)",
    company: "무신사",
    department: "Backend Engineer",
    experience: "경력 8년 이상",
    type: "정규직",
    location: "무신사 오피스 성수"
  },
  {
    id: 5,
    title: "Frontend Engineer Assistant (채용 시스템)",
    company: "무신사",
    department: "Frontend Engineer",
    experience: "경력 1년 이상",
    type: "계약직",
    location: "무신사 오피스 성수"
  },
  {
    id: 6,
    title: "Mobile Engineer (iOS)",
    company: "무신사",
    department: "Mobile Engineer", 
    experience: "경력 3년 이상",
    type: "정규직",
    location: "무신사 오피스 성수"
  },
  {
    id: 7,
    title: "Product Designer",
    company: "무신사 스튜디오",
    department: "Design",
    experience: "경력 5년 이상", 
    type: "정규직",
    location: "무신사 오피스 성수"
  },
  {
    id: 8,
    title: "Growth Marketing Manager",
    company: "무신사",
    department: "Growth Marketing",
    experience: "경력 5년 이상",
    type: "정규직",
    location: "무신사 오피스 성수"
  }
];

// Mock job detail data (for job detail page)
export const jobDetailData: MockJobData = {
  1: {
    id: 1,
    title: "Backend Engineer (29CM/서치앤디스커버리)",
    company: "29CM",
    department: "Backend Engineer",
    experience: "경력 7년 이상",
    type: "정규직",
    location: "무신사 오피스 성수",
    description: "29CM은 고객의 라이프 스타일에 어울리는 최적의 상품을 발견하고 소개하는 온/오프라인 셀렉트샵입니다. 2011년, '고객의 더 나은 선택을 돕는다'라는 미션으로부터 출발한 후, 2024년 거래액 1조를 돌파했으며, 매년 두 자릿수의 성장률을 지속하며 고속 성장 중입니다. 더 많고 더 저렴한 상품을 추구하는 다른 기업들과 달리 우리는 29CM만의 방식이 담긴 콘텐츠를 선보이며 브랜드와 고객 모두에게 대단한 가치를 플랫폼을 만들어가고 있습니다.",
    teamIntro: "29CM에 Customer Engagement Engineering 실에는 Search & Discovery 팀과 Campaign & Content 팀이 있으며, 고객이 29CM 가치를 발견하고 탐색할 수 있는 경험을 제공하는 핵심 조직입니다. 우리는 전시와 콘텐츠를 통해 고객의 관심을 끌고, 설득하거나, 제한된 그리고 레어 같은 발견 기능을 통해 고객이 원하는 상품과 콘텐츠를 더 쉽게 찾고 탐색할 수 있는 핵심 기능을 개발합니다.",
    responsibilities: [
      "전반적인 전시/콘텐츠 영역을 책임지며, 대규모 트래픽을 안정적으로 처리하고 고객에게 최적의 콘텐츠를 제공합니다.",
      "고객의 발견 경험을 구성하는 설득하기, 즐기기, 채워넣기, 레어 등의 기능을 설계하고 개발합니다.",
      "고객이 상품을 찾고 발견하는 탐색 여정을 돕기 위해 프론트엔드와 모바일이 최적화된 BFF API를 개발합니다.",
      "폭발적으로 증가하는 트래픽에도 흔들림 없는 확장성과 안정성을 갖춘 시스템을 설계합니다.",
      "실시간 데이터 파이프라인을 구축하여, 각 시스템에 필요한 데이터를 신속하게 제공하는 환경을 만듭니다.",
      "우리가 만든 시스템 통해 고객과 파트너 모두에게 신뢰받고 프로덕츠를 구축하고, 29CM가 더 많은 사용자들에게 선택받는 서비스로 자리 잡을 수 있도록 기여합니다."
    ],
    requirements: "7년 이상의 개발 경험이 있으신 분 혹은 그에 준하는 역량을 갖추신 분"
  },
  2: {
    id: 2,
    title: "Backend Engineer (29CM/세일프라이싱)",
    company: "29CM",
    department: "Backend Engineer",
    experience: "경력 7년 이상",
    type: "정규직",
    location: "무신사 오피스 성수",
    description: "29CM은 고객의 라이프 스타일에 어울리는 최적의 상품을 발견하고 소개하는 온/오프라인 셀렉트샵입니다. 세일프라이싱 팀에서는 고객에게 더 나은 가격과 혜택을 제공하는 시스템을 개발하고 있습니다.",
    teamIntro: "세일프라이싱 팀은 29CM의 핵심 경쟁력 중 하나인 가격 경쟁력을 책임지는 팀입니다. 다양한 할인 정책과 프로모션을 효율적으로 관리하고, 고객에게 최적의 가격을 제공하는 시스템을 개발합니다.",
    responsibilities: [
      "세일, 할인, 프로모션 관련 시스템을 설계하고 개발합니다.",
      "복잡한 가격 정책을 효율적으로 처리할 수 있는 시스템을 구축합니다.",
      "대용량 트래픽 상황에서도 안정적으로 작동하는 가격 계산 엔진을 개발합니다."
    ],
    requirements: "7년 이상의 개발 경험이 있으신 분 혹은 그에 준하는 역량을 갖추신 분"
  },
  3: {
    id: 3,
    title: "Backend Engineer (Core Catalog)",
    company: "무신사",
    department: "Backend Engineer",
    experience: "경력 5년 이상",
    type: "정규직",
    location: "무신사 오피스 성수",
    description: "무신사는 국내 최대 패션 플랫폼으로, 매일 수십만 명의 고객이 이용하는 서비스입니다. Core Catalog 팀에서는 상품 정보의 핵심 시스템을 담당합니다.",
    teamIntro: "Core Catalog 팀은 무신사 플랫폼의 모든 상품 정보를 관리하는 핵심 팀입니다. 수십만 개의 상품 데이터를 효율적으로 관리하고, 고객이 원하는 상품을 빠르게 찾을 수 있도록 하는 시스템을 개발합니다.",
    responsibilities: [
      "상품 카탈로그 시스템의 설계 및 개발을 담당합니다.",
      "대용량 상품 데이터를 효율적으로 관리하는 시스템을 구축합니다.",
      "상품 검색 및 필터링 성능을 최적화합니다."
    ],
    requirements: "5년 이상의 개발 경험이 있으신 분 혹은 그에 준하는 역량을 갖추신 분"
  },
  4: {
    id: 4,
    title: "Backend Engineer (Platform Business Operation)",
    company: "무신사",
    department: "Backend Engineer",
    experience: "경력 8년 이상",
    type: "정규직",
    location: "무신사 오피스 성수",
    description: "무신사는 국내 최대 패션 플랫폼으로, 매일 수십만 명의 고객이 이용하는 서비스입니다. Platform Business Operation 팀에서는 비즈니스 운영을 지원하는 핵심 시스템을 개발합니다.",
    teamIntro: "Platform Business Operation 팀은 무신사의 비즈니스 운영을 효율화하는 다양한 시스템을 개발하는 팀입니다. 파트너사 관리, 정산, 물류 등 비즈니스의 핵심 프로세스를 지원하는 시스템을 담당합니다.",
    responsibilities: [
      "비즈니스 운영을 지원하는 백오피스 시스템을 개발합니다.",
      "파트너사와의 연동 시스템을 설계하고 구현합니다.",
      "정산 및 물류 관련 시스템의 안정성과 정확성을 보장합니다."
    ],
    requirements: "8년 이상의 개발 경험이 있으신 분 혹은 그에 준하는 역량을 갖추신 분"
  },
  5: {
    id: 5,
    title: "Frontend Engineer Assistant (채용 시스템)",
    company: "무신사",
    department: "Frontend Engineer",
    experience: "경력 1년 이상",
    type: "계약직",
    location: "무신사 오피스 성수",
    description: "무신사는 지속적으로 성장하고 있는 회사로, 우수한 인재 채용이 매우 중요합니다. 채용 시스템 개발을 통해 더 나은 채용 경험을 제공하고자 합니다.",
    teamIntro: "HR Tech 팀에서는 채용 프로세스를 개선하고 효율화하는 다양한 시스템을 개발합니다. 지원자와 면접관 모두에게 더 나은 경험을 제공하는 것이 목표입니다.",
    responsibilities: [
      "채용 홈페이지 및 지원서 작성 시스템을 개발합니다.",
      "면접 일정 관리 및 후보자 관리 시스템을 구축합니다.",
      "채용 데이터 분석 및 리포팅 시스템을 개발합니다."
    ],
    requirements: "1년 이상의 프론트엔드 개발 경험이 있으신 분"
  },
  6: {
    id: 6,
    title: "Mobile Engineer (iOS)",
    company: "무신사",
    department: "Mobile Engineer",
    experience: "경력 3년 이상",
    type: "정규직",
    location: "무신사 오피스 성수",
    description: "무신사 앱은 국내 패션 앱 중 사용자 수 1위를 기록하고 있습니다. iOS 팀에서는 더 나은 모바일 쇼핑 경험을 제공하기 위해 지속적으로 개선하고 있습니다.",
    teamIntro: "iOS 팀은 무신사 앱의 iOS 버전을 개발하고 운영하는 팀입니다. 사용자 경험을 최우선으로 생각하며, 최신 iOS 기술을 적극 도입하여 혁신적인 기능을 개발합니다.",
    responsibilities: [
      "무신사 iOS 앱의 신규 기능을 개발하고 기존 기능을 개선합니다.",
      "앱의 성능을 최적화하고 안정성을 향상시킵니다.",
      "최신 iOS 기술과 디자인 트렌드를 적용합니다."
    ],
    requirements: "3년 이상의 iOS 개발 경험이 있으신 분"
  },
  7: {
    id: 7,
    title: "Product Designer",
    company: "무신사 스튜디오",
    department: "Design",
    experience: "경력 5년 이상",
    type: "정규직",
    location: "무신사 오피스 성수",
    description: "무신사 스튜디오는 브랜드와 콘텐츠를 기획하고 제작하는 무신사의 크리에이티브 조직입니다. 다양한 브랜드 프로젝트와 캠페인을 통해 독창적인 경험을 만들어갑니다.",
    teamIntro: "무신사 스튜디오의 디자인 팀은 브랜드 아이덴티티부터 디지털 경험까지 폭넓은 영역의 디자인을 담당합니다. 패션과 라이프스타일 트렌드를 선도하는 창의적인 작업을 진행합니다.",
    responsibilities: [
      "브랜드 캠페인 및 프로젝트의 비주얼 디자인을 담당합니다.",
      "다양한 디지털 미디어를 위한 크리에이티브를 제작합니다.",
      "브랜드 가이드라인을 수립하고 일관된 디자인 시스템을 구축합니다."
    ],
    requirements: "5년 이상의 제품 디자인 경험이 있으신 분"
  },
  8: {
    id: 8,
    title: "Growth Marketing Manager",
    company: "무신사",
    department: "Growth Marketing",
    experience: "경력 5년 이상",
    type: "정규직",
    location: "무신사 오피스 성수",
    description: "무신사는 지속적인 성장을 위해 데이터 기반의 마케팅 전략을 구사하고 있습니다. Growth Marketing 팀에서는 다양한 채널을 통한 고객 획득과 유지를 담당합니다.",
    teamIntro: "Growth Marketing 팀은 무신사의 성장을 이끄는 핵심 조직입니다. 퍼포먼스 마케팅부터 브랜드 마케팅까지 통합적인 관점에서 마케팅 전략을 수립하고 실행합니다.",
    responsibilities: [
      "다양한 디지털 마케팅 채널을 통한 고객 획득 전략을 수립합니다.",
      "마케팅 캠페인의 성과를 분석하고 최적화합니다.",
      "신규 마케팅 채널을 발굴하고 테스트합니다."
    ],
    requirements: "5년 이상의 디지털 마케팅 경험이 있으신 분"
  }
}; 