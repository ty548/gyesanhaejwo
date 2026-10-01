# 계산해줘

대한민국 생활·금융 계산기 사이트. 로그인 없이 사용할 수 있는 모바일 우선 정적 사이트입니다.

## 실행

Node.js 20 이상에서 의존성 설치 없이 실행할 수 있습니다.

```bash
npm run build
npm test
npm run dev
```

`dist/`를 정적 호스팅에 배포하면 `/loan/`, `/severance/` 같은 독립 URL에서 각 계산기를 사용할 수 있습니다. 개발 서버는 `http://localhost:4173`입니다.

공식 Production 주소는 `https://calc.memorimap.kr`입니다. Vercel 기본 주소 `https://gyesanhaejwo.vercel.app`도 접근할 수 있지만, 빌드되는 canonical·Open Graph URL·사이트맵·robots.txt의 사이트맵 경로·구조화 데이터는 공식 주소를 사용합니다. 동일한 정적 사이트를 두 호스트에서 제공할 때 검색엔진의 기준 URL은 공식 주소로 통일합니다. [Vercel Project Settings → Domains](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting)에서 기본 주소를 공식 주소로 리디렉션할 수 있는지 확인할 수 있으며, 현재 코드에는 호스트별 강제 리디렉션을 넣지 않았습니다. 다른 도메인으로 이전할 때는 빌드 환경 변수 `SITE_URL`에 새 `https://` 주소를 설정하고 다시 배포하세요.

배포 후 Google Search Console과 네이버 서치어드바이저에는 공식 주소를 등록하세요. 단계별 안내는 [검색엔진 등록 체크리스트](docs/search-registration-checklist.md)에 있습니다.

Vercel 배포 설정은 `vercel.json`에 있습니다. 광고 수익과 비용 대비 ROI의 가정별 계산은 [광고 수익 시나리오](docs/advertising-roi.md)를 참고하세요.

계산식 검증 범위와 각 계산기의 제외 항목은 [계산 로직 검증 기록](docs/calculation-audit.md)에 정리했습니다.

## 계산기

일반 계산기 1개, 금융·급여·부동산·세금·환율 계산기 10개와 날짜 차이, N일 전·후, D-Day, 영업일, 근무시간, 영상 배속, 퇴근시계, 월급시계 8개를 제공합니다. 환율은 Frankfurter API에서 기준 환율을 조회하며 실패 시 직접 입력할 수 있습니다.

세금·대출 규제·은행 조건은 개인 상황과 시점에 따라 달라집니다. 변동 가능한 값은 직접 입력하며 결과는 참고용입니다. 연봉 계산기의 소득세는 자동 세액표 대신 입력한 월 원천징수액을 사용합니다.

## 계산 기준 참고

- [고용노동부 퇴직금 계산](https://1350.moel.go.kr/home/hp/retirementpaycal/retirementpaycal.jsp)
- [고용노동부 2026년 최저임금](https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=18144)
- [고용노동부 주휴수당 안내](https://1350.moel.go.kr/rtmview.do?id=1000074928)
- [국민연금공단 2026년 근로자 보험료율](https://m.nps.or.kr/pnsinfo/ntpsklg/getOHAF0097M0.do)
- [국민건강보험공단 2026년 보험료율](https://edi.nhis.or.kr/portal/images/popup/20251204_pop01longdesc.html)
- [국세청 부가가치세 개요](https://nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7693&mi=2272)
- [금융위원회 DSR 설명](https://www.fsc.go.kr/po020201/27351?curPage=1)
- [Frankfurter 환율 API](https://frankfurter.dev/)
