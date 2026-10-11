export const categories = [
  { id: 'general', name: '일반 계산', icon: '🧮', description: '사칙연산과 백분율을 바로 계산' },
  { id: 'finance', name: '대출 · 금융', icon: '🏦', description: '상환액과 저축 목표를 한눈에' },
  { id: 'work', name: '직장 · 급여', icon: '💼', description: '월급부터 퇴직금까지' },
  { id: 'property', name: '부동산', icon: '🏠', description: '구매 비용과 수익률 점검' },
  { id: 'business', name: '사업 · 세금', icon: '🧾', description: '사업에 필요한 빠른 계산' },
  { id: 'life', name: '생활 · 환율', icon: '🌐', description: '매일 쓰는 간편 계산' },
  { id: 'date-time', name: '날짜 · 시간', icon: '📅', description: '날짜부터 근무시간까지 빠르게 계산' }
];

export const tools = [
  { slug: 'loan', title: '대출 계산기', icon: '🏦', category: 'finance', short: '월 상환액과 총 이자를 비교해요', description: '원리금균등·원금균등 방식의 월 상환액, 총 이자와 총 상환액을 계산합니다.', tag: '가장 많이 찾는 계산기' },
  { slug: 'severance', title: '퇴직금 계산기', icon: '💼', category: 'work', short: '근속기간과 평균임금으로 계산해요', description: '입사일과 퇴직일, 퇴직 전 3개월 임금으로 예상 퇴직금을 계산합니다.' },
  { slug: 'salary', title: '연봉 실수령액 계산기', icon: '💰', category: 'work', short: '4대보험과 세금을 뺀 월급', description: '2026년 근로자 보험료율과 직접 입력한 원천징수세액으로 월 실수령액을 추정합니다.' },
  { slug: 'salary-reverse', title: '실수령액 역산 계산기', icon: '🎯', category: 'work', short: '원하는 월 실수령액으로 세전 연봉 역산', description: '목표 월 실수령액과 비과세액, 월 원천징수 소득세를 입력하면 2026년 근로자 보험료율을 적용해 필요한 세전 연봉을 추정합니다.', keywords: '실수령액으로 연봉 계산 월급 역산 세전 연봉 세후 세전' },
  { slug: 'hourly', title: '시급·주휴수당 계산기', icon: '⏰', category: 'work', short: '주휴수당과 예상 월급까지', description: '시급과 주 근로시간으로 주휴수당, 주급과 월 환산 급여를 계산합니다.' },
  { slug: 'savings', title: '적금·예금 계산기', icon: '🐷', category: 'finance', short: '만기 원금과 세후 이자', description: '정기적금 또는 정기예금의 만기 원금, 이자, 세후 수령액을 계산합니다.' },
  { slug: 'vat', title: '부가세 계산기', icon: '🧾', category: 'business', short: '공급가액·부가세·납부 예상액', description: '일반과세자 10% 기준 공급가액과 부가세를 나누고 매입세액을 반영합니다.' },
  { slug: 'dsr-ltv', title: 'DSR·LTV 계산기', icon: '📊', category: 'finance', short: '소득과 담보가치 기준 확인', description: '연간 원리금 상환액으로 DSR을, 주택 가치 대비 대출액으로 LTV를 계산합니다.' },
  { slug: 'apartment-cost', title: '아파트 구매 총비용', icon: '🏠', category: 'property', short: '취득비용과 필요한 자기자본', description: '매매가, 취득 관련 세금, 중개보수와 대출을 합쳐 총 필요금액을 계산합니다.' },
  { slug: 'commercial-property', title: '상가 취득·수익률', icon: '🏬', category: 'property', short: '실투자금과 임대 수익률', description: '상가 취득비용, 순영업소득과 대출 이자를 반영한 수익률을 계산합니다.' },
  { slug: 'exchange', title: '환율 계산기', icon: '🌐', category: 'life', short: '18개 통화의 기준 환율과 환전 비용', description: '18개 통화의 기준 환율을 조회하거나 직접 입력해 수수료와 우대율을 비교합니다.', keywords: '달러 엔화 유로 환전 100달러' },
  { slug: 'date-diff', title: '날짜 차이 계산기', icon: '📅', category: 'date-time', short: '두 날짜 사이 며칠인지', description: '시작일과 종료일 사이의 일수, 주·일과 요일을 정확히 계산합니다.', keywords: '날짜 계산기 며칠 차이 윤년' },
  { slug: 'date-offset', title: 'N일 전·후 계산기', icon: '🗓️', category: 'date-time', short: '오늘부터 100일 후는?', description: '기준일로부터 지정한 일수 전이나 후의 날짜와 요일을 계산합니다.', keywords: '며칠 후 계산기 며칠 전 계산기 오늘부터 100일 후' },
  { slug: 'dday', title: 'D-Day 계산기', icon: '⏳', category: 'date-time', short: '중요한 날까지 남은 시간', description: '목표일과 기준일 사이의 D-Day, 총 일수와 시간을 계산합니다.', keywords: '디데이 계산기 기념일' },
  { slug: 'business-days', title: '영업일 계산기', icon: '📆', category: 'date-time', short: '주말을 제외한 평일 수', description: '두 날짜 사이의 전체 일수와 토·일요일을 제외한 평일 수를 계산합니다.', keywords: '평일 계산기 주말 제외' },
  { slug: 'work-time', title: '근무시간 계산기', icon: '💼', category: 'date-time', short: '휴게·야간근무까지', description: '출퇴근시각과 휴게시간으로 실제 근무시간을 계산합니다.', keywords: '출퇴근시간 계산기 야간근무' },
  { slug: 'playback-speed', title: '영상 배속 계산기', icon: '🎬', category: 'date-time', short: '시청시간과 종료 시각', description: '영상 길이와 재생 배속으로 실제 시청시간, 절약시간과 종료 시각을 계산합니다.', keywords: '1.5배속 시간 계산 영상 시간' },
  { slug: 'work-clock', title: '퇴근시계', icon: '🏁', category: 'date-time', short: '퇴근까지 남은 시간', description: '현재 시각을 기준으로 퇴근까지 남은 시간과 근무 진행률을 보여줍니다.', keywords: '퇴근시간 계산기 퇴근시계' },
  { slug: 'salary-clock', title: '월급시계', icon: '💸', category: 'date-time', short: '오늘 번 돈을 실시간으로', description: '월급과 근무시간을 바탕으로 오늘 번 돈과 시간당·분당 수입을 추정합니다.', keywords: '시급 환산 오늘 번 돈 월급시계' },
  { slug: 'discount', title: '할인율·최종가격 계산기', icon: '🏷️', category: 'life', short: '중복할인·쿠폰·배송비까지 최종 결제액', description: '상품 원가에 연속 할인율, 쿠폰, 적립금과 배송비를 반영해 최종 결제액과 실질 절감률을 계산합니다.', keywords: '할인율 계산 할인 가격 계산 중복 할인 쿠폰 최종 가격 세일 계산기' },
  { slug: 'calculator', title: '무료 온라인 계산기', icon: '🧮', category: 'general', short: '사칙연산·괄호·백분율을 빠르게', description: '사칙연산, 괄호, 백분율, 제곱과 제곱근을 키보드나 터치로 계산합니다.', keywords: '일반 계산기 사칙연산 퍼센트 계산기' }
];

export const toolBySlug = Object.fromEntries(tools.map(tool => [tool.slug, tool]));
