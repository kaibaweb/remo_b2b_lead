# 구현 기준 · 2026-10-31

## 참고 출처와 확인 한계

사용자가 제공한 GitHub 저장소는 최초 조회 시 README 한 줄만 있는 초기 상태였다. GitHub API를 통해 기존 README와 main을 확인했다.

다음 공유 대화는 일반 웹 조회에 실패했고, 브라우저에서도 호스트 접근 정책으로 차단되었다. 내용을 읽었다고 간주하지 않는다.

- 리드 에이전트 구조: https://chatgpt.com/share/6ae5535e-99c0-83ec-9cbf-7278136575ab
- 기획안: https://chatgpt.com/s/t_6ae4cfdd33208191a04ce2d6eede0e65
- 코덱스 B2B 프로젝트: https://chatgpt.com/share/6ae55722-8d2c-83ec-a884-1284f48c2fd9

기획 방향은 이전 대화 검색 결과로 복구했다. 상세 기획 원문을 검토한 것은 아니다. 관련 제약은 직접 소싱 중심, B2B의 SNS 효과가 낮다는 판단, 블로그는 신뢰·검색 노출용, FINEFIT과 Physical AI는 별도 퍼널, 중국어 랜딩·메일·WeChat 미팅 전환이다.

사용자가 참고로 제시한 기존 프로젝트와 관련된 로컬 billycustom의 `outbound/config.example.json`, `docs/outbound.md`, `AGENTS.md`를 읽어 영속 DB·유한 worker·dry-run·검증·문안 snapshot·중복 방지 원칙을 참고했다. 기존 연락처·동의 DB·비밀키·계정 설정은 가져오지 않았다. 이후 사용자 지시에 따라 malang.best의 Next.js 랜딩·문의 관리 구조를 이식했다. Next.js 편집 시 설치된 버전의 문서를 확인했다.

## 이번 구현과 미확정 영역

- FINEFIT 판매, Physical AI 데이터 수요, 한국 시장 진출을 각각 설정 가능한 트랙으로 둔다. 트랙을 함께 저장해도 상품·계약을 묶지 않는다.
- 수백 개 리드는 누적 가능한 저장소·bounded batch로 지원한다. 수백 개의 실제 검증 리드를 확보했다고 주장하지 않는다.
- 검색 키는 선택 사항이다. 없는 경우 Codex가 읽은 실제 출처를 JSON으로 import할 수 있다.
- 데이터 제공 역량·총판 계약·레퍼런스·정확한 전시회·방문 일정·연락 담당자·발신 이메일·WeChat·중국어 랜딩 URL은 확정하지 않았다. 자동으로 만들어 넣지 않는다.
- 제안 초안은 회사명과 트랙별 템플릿 기반이다. 유료 LLM 호출과 자동 모델 학습은 없다. 개별 회사 제안의 전략 검토는 Codex/운영자 역할이다.
- Gmail/Brave 어댑터는 구현했고 mock으로 검증했다. 실제 토큰을 사용한 원격 연결, 전송, 회신 폴링, 서버 배포와 자동 일정은 아직 활성화하지 않았다.
- 메일 수신동의 정책은 현재 명시적 동의만 지원한다. 공개 주소를 발견했다는 이유로 발송을 허용하지 않는다. 이는 이 구현의 보수적 운영 정책이며 특정 국가 법률 전체에 대한 해석이 아니다.
- DB·승인 CLI는 신뢰된 운영자 전용이다. 아웃바운드용 다중 사용자 로그인·권한별 승인은 미구현이다. 웹 인바운드는 별도 Firebase 관리자 로그인과 CRM을 제공한다.

## 어댑터 원문 문서

- Brave: https://api-dashboard.search.brave.com/app/documentation/web-search/get-started
- Gmail profile: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users/getProfile
- Gmail send: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send

고정 API 호스트·TLS 검증·리다이렉트 금지·15초 타임아웃·2MB 응답 제한을 사용한다. 일반 웹사이트를 직접 가져오는 크롤러는 제공하지 않는다. 현재 실행 환경의 네트워크 정책이 실제 API 연결을 허용하는지는 별도 진단 대상이다.

## 랜딩 구조 변경

사용자 최종 지시: Vercel에 직접 올리지 않고 GitHub에 푸시한다. malang.best의 구조·시스템을 재사용하고 랜딩 내용은 전부 리모 중국 B2B용으로 변경한다.

로컬 billycustom의 Next.js App Router, 공통 UI, 문의 저장 후 알림, 관리자 로그인·리드·상태·CSV·영상·메일 템플릿 관리 흐름을 재사용했다. 실제 malang.best URL은 조회 도구에서 접근할 수 없어 로컬 소스 스냅샷을 참고했으며 최신 운영본과 완전히 동일하다고 주장하지 않는다. 상품 이미지와 기존 고객·실적·영상·카카오톡 링크·연락처·비밀키는 이식하지 않았다. REMO 전용 컬렉션과 공백 환경변수를 사용한다.

별도 정적 HTML 초안은 폐기했으며 Next.js 랜딩으로 대체했다. Vercel 계정에 직접 프로젝트를 만들거나 배포하지 않는다. 웹 브라우저 QA는 관리형 프리뷰가 Next.js에 지원되지 않는 --host 옵션을 붙여 시작에 실패해 확인하지 못했다. 빌드·타입·단위 검증과 빌드된 라우트 직접 호출을 기준으로 점검한다.

## 관리자 콘솔 Firebase Hosting 격리 및 보안·비용 최적화 (2026-11-01)

- **공개 랜딩과 관리자 물리적 격리**:
  - 중국 및 글로벌 바이어가 접속하는 공개 랜딩(Vercel: `remob2blead.vercel.app`)과 내부 관리자 콘솔을 완전히 분리.
  - 관리자 기능은 구글 파이어베이스 호스팅(`remo-b2b.web.app`)에 단독 배포하여 중국 트래픽 스크랩 및 공격 표면(Attack Surface) 원천 차단.
- **구글 서버단 보안 규칙 (`firestore.rules`)**:
  - `gitkaiba@gmail.com` 구글 Firebase Auth 인증 토큰이 없는 모든 비인가 요청은 구글 클라우드 DB 레벨에서 `403 Forbidden` 차단.
  - Identity Toolkit API를 통해 프로젝트 `remo-b2b`의 `email.enabled = true` 활성화 적용.
- **Spark 무료 플랜 비용 0원 아키텍처**:
  - 백그라운드 실시간 구독(`onSnapshot`) 완전 배제 (메모리 누수 및 과도한 읽기 비용 원천 방지).
  - 단발성 쿼리(`getDocs` limit 50~100) + 브라우저 메모리 온샷 캐시 유지.
  - 우측 상단 [🔄 새로고침] 버튼 클릭 시에만 단발성 재조회.
- **위챗 연락처 딥링크 표준화**:
  - 공식 위챗 아이디를 `zeeeeeyul`로 전역 동기화.
  - 텍스트 클릭 시 모바일 위챗 앱을 직접 띄우는 `weixin://dl/chat?zeeeeeyul` 딥링크 및 원클릭 클립보드 복사 동시 지원.
