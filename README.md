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

실제 배포 도메인이 정해지면 빌드 환경 변수 `SITE_URL`에 `https://example.com` 형태의 주소를 설정하세요. 그러면 각 페이지의 canonical·Open Graph URL, `sitemap.xml`, `robots.txt`의 사이트맵 경로가 생성됩니다. 배포 후 실제 URL을 Google Search Console에 등록하고 색인 및 Core Web Vitals를 확인하세요.

## 계산기

대출, 퇴직금, 연봉 실수령액, 시급·주휴수당, 적금·예금, 부가세, DSR·LTV, 아파트 구매 총비용, 상가 취득·수익률, 환율 계산기를 제공합니다. 환율은 Frankfurter API에서 최신 기준 환율을 조회하며 실패 시 직접 입력할 수 있습니다.

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
