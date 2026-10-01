export const categories = [
  { id: 'finance', name: '대출 · 금융', icon: '🏦', description: '상환액과 저축 목표를 한눈에' },
  { id: 'work', name: '직장 · 급여', icon: '💼', description: '월급부터 퇴직금까지' },
  { id: 'property', name: '부동산', icon: '🏠', description: '구매 비용과 수익률 점검' },
  { id: 'business', name: '사업 · 세금', icon: '🧾', description: '사업에 필요한 빠른 계산' },
  { id: 'life', name: '생활 · 환율', icon: '🌐', description: '매일 쓰는 간편 계산' }
];

export const tools = [
  { slug: 'loan', title: '대출 계산기', icon: '🏦', category: 'finance', short: '월 상환액과 총 이자를 비교해요', description: '원리금균등·원금균등 방식의 월 상환액, 총 이자와 총 상환액을 계산합니다.', tag: '가장 많이 찾는 계산기' },
  { slug: 'severance', title: '퇴직금 계산기', icon: '💼', category: 'work', short: '근속기간과 평균임금으로 계산해요', description: '입사일과 퇴직일, 퇴직 전 3개월 임금으로 예상 퇴직금을 계산합니다.' },
  { slug: 'salary', title: '연봉 실수령액 계산기', icon: '💰', category: 'work', short: '4대보험과 세금을 뺀 월급', description: '2026년 근로자 보험료율과 직접 입력한 원천징수세액으로 월 실수령액을 추정합니다.' },
  { slug: 'hourly', title: '시급·주휴수당 계산기', icon: '⏰', category: 'work', short: '주휴수당과 예상 월급까지', description: '시급과 주 근로시간으로 주휴수당, 주급과 월 환산 급여를 계산합니다.' },
  { slug: 'savings', title: '적금·예금 계산기', icon: '🐷', category: 'finance', short: '만기 원금과 세후 이자', description: '정기적금 또는 정기예금의 만기 원금, 이자, 세후 수령액을 계산합니다.' },
  { slug: 'vat', title: '부가세 계산기', icon: '🧾', category: 'business', short: '공급가액·부가세·납부 예상액', description: '일반과세자 10% 기준 공급가액과 부가세를 나누고 매입세액을 반영합니다.' },
  { slug: 'dsr-ltv', title: 'DSR·LTV 계산기', icon: '📊', category: 'finance', short: '소득과 담보가치 기준 확인', description: '연간 원리금 상환액으로 DSR을, 주택 가치 대비 대출액으로 LTV를 계산합니다.' },
  { slug: 'apartment-cost', title: '아파트 구매 총비용', icon: '🏠', category: 'property', short: '취득비용과 필요한 자기자본', description: '매매가, 취득 관련 세금, 중개보수와 대출을 합쳐 총 필요금액을 계산합니다.' },
  { slug: 'commercial-property', title: '상가 취득·수익률', icon: '🏬', category: 'property', short: '실투자금과 임대 수익률', description: '상가 취득비용, 순영업소득과 대출 이자를 반영한 수익률을 계산합니다.' },
  { slug: 'exchange', title: '환율 계산기', icon: '🌐', category: 'life', short: '실시간 기준 환율과 환전 비용', description: '기준 환율을 조회하거나 직접 입력해 환전 수수료를 반영한 금액을 계산합니다.' }
];

export const toolBySlug = Object.fromEntries(tools.map(tool => [tool.slug, tool]));
