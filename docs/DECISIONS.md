# 구현 기준 · 2026-10-31

## 참고 출처와 확인 한계

사용자가 제공한 GitHub 저장소는 최초 조회 시 README 한 줄만 있는 초기 상태였다. GitHub API를 통해 기존 README와 main을 확인했다.

다음 공유 대화는 일반 웹 조회에 실패했고, 브라우저에서도 호스트 접근 정책으로 차단되었다. 내용을 읽었다고 간주하지 않는다.

- 리드 에이전트 구조: https://chatgpt.com/share/6ae5535e-99c0-83ec-9cbf-7278136575ab
- 기획안: https://chatgpt.com/s/t_6ae4cfdd33208191a04ce2d6eede0e65
- 코덱스 B2B 프로젝트: https://chatgpt.com/share/6ae55722-8d2c-83ec-a884-1284f48c2fd9

기획 방향은 이전 대화 검색 결과로 복구했다. 상세 기획 원문을 검토한 것은 아니다. 관련 제약은 직접 소싱 중심, B2B의 SNS 효과가 낮다는 판단, 블로그는 신뢰·검색 노출용, FINEFIT과 Physical AI는 별도 퍼널, 중국어 랜딩·메일·WeChat 미팅 전환이다.

사용자가 참고로 제시한 기존 프로젝트와 관련된 로컬 billycustom의 `outbound/config.example.json`, `docs/outbound.md`, `AGENTS.md`를 읽어 영속 DB·유한 worker·dry-run·검증·문안 snapshot·중복 방지 원칙을 참고했다. 기존 연락처·동의 DB·비밀키·계정 설정은 가져오지 않았다. 이 프로젝트에는 Next.js 코드가 없어 기존 Next.js 지침은 적용 대상이 아니다.

## 이번 구현과 미확정 영역

- FINEFIT 판매, Physical AI 데이터 수요, 한국 시장 진출을 각각 설정 가능한 트랙으로 둔다. 트랙을 함께 저장해도 상품·계약을 묶지 않는다.
- 수백 개 리드는 누적 가능한 저장소·bounded batch로 지원한다. 수백 개의 실제 검증 리드를 확보했다고 주장하지 않는다.
- 검색 키는 선택 사항이다. 없는 경우 Codex가 읽은 실제 출처를 JSON으로 import할 수 있다.
- 데이터 제공 역량·총판 계약·레퍼런스·정확한 전시회·방문 일정·연락 담당자·발신 이메일·WeChat·중국어 랜딩 URL은 확정하지 않았다. 자동으로 만들어 넣지 않는다.
- 제안 초안은 회사명과 트랙별 템플릿 기반이다. 유료 LLM 호출과 자동 모델 학습은 없다. 개별 회사 제안의 전략 검토는 Codex/운영자 역할이다.
- Gmail/Brave 어댑터는 구현했고 mock으로 검증했다. 실제 토큰을 사용한 원격 연결, 전송, 회신 폴링, 서버 배포와 자동 일정은 아직 활성화하지 않았다.
- 메일 수신동의 정책은 현재 명시적 동의만 지원한다. 공개 주소를 발견했다는 이유로 발송을 허용하지 않는다. 이는 이 구현의 보수적 운영 정책이며 특정 국가 법률 전체에 대한 해석이 아니다.
- DB·승인 CLI는 신뢰된 운영자 전용이다. 다중 사용자 로그인·암호화·권한별 승인·웹 CRM은 미구현이다.

## 어댑터 원문 문서

- Brave: https://api-dashboard.search.brave.com/app/documentation/web-search/get-started
- Gmail profile: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users/getProfile
- Gmail send: https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send

고정 API 호스트·TLS 검증·리다이렉트 금지·15초 타임아웃·2MB 응답 제한을 사용한다. 일반 웹사이트를 직접 가져오는 크롤러는 제공하지 않는다. 현재 실행 환경의 네트워크 정책이 실제 API 연결을 허용하는지는 별도 진단 대상이다.
