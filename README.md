# 중국 리드봇 | REMO China B2B Lead Bot

공식 저장소: [kaibaweb/remo_b2b_lead](https://github.com/kaibaweb/remo_b2b_lead)

구현 코드: [`codex/china-lead-agent-v1`](https://github.com/kaibaweb/remo_b2b_lead/tree/codex/china-lead-agent-v1) 작업 브랜치에서 확인하고 실행할 수 있습니다.

**중국 기업을 찾고, 연락처와 사업 수요를 검증해 중국어 제안과 상담·미팅으로 연결하는 B2B 영업 리드봇입니다.**

기업 검색부터 출처 확인, 중복 제거, 사업별 분류, 제안 초안 작성, 회신 기록까지 하나의 흐름으로 관리합니다. 회신 성과를 다음 검색의 우선순위에 반영해 유효한 리드를 누적하는 것이 목표입니다.

## 주요 기능

- **중국 기업 소싱:** 사업별 검색어로 잠재 고객·유통사·협력사 후보를 수집합니다.
- **근거·연락처 검증:** 출처 URL·확인일·원문과 공개 업무 연락처를 저장하고 검토합니다.
- **사업 기회 분류:** FINEFIT 판매, Physical AI 데이터 수요, 한국 진출 지원을 분리합니다.
- **중국어 제안 초안:** 회사와 제안 트랙에 맞는 제목·본문·미팅 CTA를 생성합니다.
- **영업 이력 관리:** 회신·미팅·견적 요청을 기록하고 중복 연락과 수신거부를 관리합니다.
- **소싱 개선:** 검색어별 회신 성과에 따라 다음 조사 순서를 조정합니다.
- **운영 리포트:** 후보·검증 리드·제안 초안·발송 상태를 HTML·JSON·CSV로 확인합니다.

Codex가 조사·판단을 맡고, Python 실행기가 데이터 저장과 실행 한도를 관리합니다. Python 3.11 이상이면 추가 런타임 패키지 없이 실행됩니다. 실제 검색과 메일 발송에는 별도의 API 연결이 필요하며, 메일 발송은 기본 꺼져 있습니다.

## 사업별 퍼널

| 트랙 | 발굴 대상 | 검증할 수요 |
|---|---|---|
| `finefit` | 피트니스 체인 본사, 재활·운동건강 기관, 장비 유통사 | FINEFIT Mirror 도입·유통 |
| `physical_ai_data` | 휴머노이드·구체화 AI·로봇 기업 | 훈련 데이터, 실패·복구, 사람 동작 신호 |
| `korea_entry` | 한국 진출을 검토하는 중국 로봇 기업 | 총판·유통망·SI·유지보수 파트너 |

같은 회사라도 사업 기회는 별도로 저장합니다. 캠페인 내 동일 수신자 발송은 트랙을 넘어 한 번만 허용합니다. SNS 운영 대신 직접 리드 소싱을 중심으로 하며, 블로그 자동 발행과 중국어 웹사이트는 이 저장소의 현재 구현 범위에 포함되지 않습니다.

## 바로 실행

새로 내려받을 때:

```bash
git clone --branch codex/china-lead-agent-v1 https://github.com/kaibaweb/remo_b2b_lead.git
cd remo_b2b_lead
```

기존 Git 작업 사본의 주소를 바꿀 때:

```bash
git remote set-url origin https://github.com/kaibaweb/remo_b2b_lead.git
git remote -v
```

프로젝트 실행:

```bash
cp config.example.json config.local.json
python -m remo_lead --config config.local.json init
python -m remo_lead --config config.local.json doctor
python -m remo_lead --config config.example.json demo
python -m unittest discover -s tests -v
```

`demo`는 **가상 회사 1개·사업 기회 2개·중국어 초안 2개**, 메모리 DB, 외부 요청 0건으로 동작합니다. 운영 DB에 가상 리드나 가상 수신동의를 쓰지 않습니다. `doctor`는 환경변수 존재 여부만 확인하며, API 접근 성공을 뜻하지 않습니다.

## 운영 순서

```bash
# 가설·검색어: 3개 사업 트랙, 초기 검색어 9개
python -m remo_lead plan

# 실제 검색: BRAVE_SEARCH_API_KEY가 설정된 경우에만, 1회 최대 3요청
python -m remo_lead discover
python -m remo_lead list candidates

# 실제 출처를 조사하고 JSON으로 정리. 한 파일 최대 20개 회사
python -m remo_lead import private/companies.json
python -m remo_lead list evidence
python -m remo_lead verify evidence 1 --operator actual-reviewer
python -m remo_lead verify contacts 1 --operator actual-reviewer

# 자격 분류·중국어 초안·HTML/JSON/CSV 리포트. 발송 없음
python -m remo_lead cycle
python -m remo_lead draft 1 1
python -m remo_lead dispatch 1
```

기본 설정 파일은 `config.local.json`, DB는 `.state/remo.sqlite3`입니다. 다른 위치는 전역 인자 `--config`, `--db`로 **명령어 앞에** 지정합니다. 상대 경로는 현재 디렉터리 기준입니다. 서버에서는 영속 디스크의 절대 DB 경로를 사용하고, 실행 중인 DB의 백업은 SQLite backup API로 만드세요.

검색 결과는 `candidates`에만 저장합니다. 공식 홈페이지·연락처 페이지를 직접 읽고 회사와 연결한 뒤 import해야 합니다. import된 `verified_by` 필드는 무시됩니다. 실제 검토자가 출처를 확인한 후 별도 `verify` 명령으로 검증합니다. 출처 URL과 원문에 정확한 이메일이 있어야 초안이 생성됩니다.

## 하네스 루프

1. `plan`: 초기 가설과 검색어, 시도 수, 긍정·부정 회신 기반 우선순위를 반환합니다.
2. `discover`: Brave 검색을 호출하고 후보 URL·제목·스니펫을 저장합니다. 검색 한 번 최대 20개 결과, 요청 예산 기본 3회입니다. 실패는 5분~6시간 backoff, 성공 검색어는 24시간 cooldown입니다.
3. Codex 조사와 `import/verify`: 회사·연락처·근거를 분리해 저장하고 사람이 확인합니다. 추정 이메일과 검색 스니펫 자동 승격은 없습니다.
4. `rank`: 검증 근거와 키워드 일치를 설명 가능한 규칙으로 점수화합니다. 점수는 실제 구매 의사의 확률이 아닙니다.
5. `cycle/draft`: 설정된 사업 제안·한 가지 CTA로 중국어 초안을 생성합니다. 공급 능력·매출·독점권·단가를 창작하지 않습니다.
6. `reply`: 정확히 일치하는 수신자의 회신을 기록합니다. 미팅·RFQ 상태를 구분하고, 수신거부·부정 회신·반송은 후속 발송을 차단합니다.
7. 검색어별 검증된 회신 성과가 다음 `plan` 우선순위에 반영됩니다. 새 가설 확장은 Codex가 근거를 검토해 config에 추가합니다.

이것은 모델 자체 학습이나 무제한 자율 크롤러가 아닙니다. Codex가 조사·판단을 맡고 실행기가 상태와 예산·중복 방지를 보장합니다. `AGENTS.md`가 다음 Codex 작업의 실행 지침입니다.

## 실제 메일 연결

실제 발송은 기본 꺼져 있습니다. 공개 이메일은 수신동의로 취급하지 않습니다. 현재 정책은 **문서화된 명시적 수신동의**만 지원합니다. 다른 접촉 근거를 쓰려면 별도 정책 구현·검토가 필요합니다.

1. 실제 `sender_name`, `sender_email`, `sender_address`를 설정합니다. 제공받은 경우에만 `landing_url`, `wechat_id`를 입력합니다.
2. 운영 환경에서 Google OAuth access token을 `GMAIL_ACCESS_TOKEN`으로 제공합니다. 이 코드는 OAuth 앱 등록·로그인·토큰 갱신을 수행하지 않습니다. `gmail.send`와 `gmail.metadata` 범위가 필요합니다. Gmail 주 계정과 발신자가 정확히 같아야 하며 Send As 별칭은 미지원입니다.
3. `permit private/permission.json`으로 실제 수신동의 근거를 기록합니다.
4. 정확한 초안을 확인하고 `approve DRAFT_ID --sha256 EXACT_SHA --operator NAME`으로 24시간 유효한 승인을 저장합니다. CLI 승인 기록은 로컬 운영자 통제이며 사용자 인증이나 전자서명이 아닙니다.
5. 사용자가 해당 수신자·문안의 발송을 지시한 범위에서 `live_enabled: true`와 `dispatch DRAFT_ID --live`를 함께 사용합니다.

초안·발신 정보·근거가 바뀌거나 만료되면 승인은 무효입니다. 발송 직전에 suppression·동의·검토·일일 한도·Gmail 계정 일치를 검사합니다. DB에서 수신자를 원자적으로 예약해 중복 발송을 막습니다. `ACCEPTED`는 Gmail 접수이며 실제 도착·열람이 아닙니다. 타임아웃·모호한 결과는 `UNKNOWN`, 중단된 예약은 `SENDING` 상태로 남고 **자동 재발송하지 않습니다**. Gmail 보낸편지함에서 `Message-ID: remo-<draft SHA>@<sender domain>`으로 사람이 대조해야 합니다.

현재 회신은 검토된 JSON으로 가져옵니다. Gmail 회신 자동 폴링·토큰 갱신·Telegram 전송·WeChat 자동 발송·첨부파일·자동 후속 메일은 구현하지 않았습니다. ChatGPT에 연결된 Gmail과 서버 실행용 Gmail 자격증명은 별도입니다.

## 저장·리포트·스케줄

SQLite: companies / evidence / contacts / opportunities / queries / candidates / drafts / permissions / approvals / deliveries / replies / suppression / audit. 영업 진행은 DISCOVERED → QUALIFIED → CONTACTED → REPLIED / MEETING / RFQ, 거절·반송·수신거부를 따로 기록합니다. 견적·계약 엔터티와 금액 정산은 후속 확장입니다.

`report` 또는 `cycle`은 `reports/latest/report.html`, `report.json`, `opportunities.csv`를 생성합니다. HTML은 외부 스크립트·추적 픽셀 없이 로컬에서 열 수 있으며 원문은 이스케이프됩니다. CSV는 스프레드시트 수식 주입을 방지합니다. 보고서에는 영업 연락처가 포함되므로 접근을 제한하세요. 기본 DB·보고서·private 파일·환경파일은 Git에서 제외됩니다.

스케줄러는 설치·활성화하지 않습니다. 필요할 때 운영 서버의 작업 스케줄러로 `cycle --search`를 실행하면 한 사이클 후 종료됩니다. 이 명령은 발송하지 않습니다. 배포 후 검색 API 허용 도메인·토큰·영속 저장소를 별도로 검증해야 합니다.

## 검증과 참고

```bash
python -m unittest discover -s tests -v
python -m remo_lead --config config.example.json demo
python -m compileall -q remo_lead
```

CI는 Python 3.11·3.12·3.13에서 오프라인 검증을 수행합니다. 샘플 입력은 `examples/`, 기획 출처와 미확정 사항은 [docs/DECISIONS.md](docs/DECISIONS.md), 상세 운영은 [docs/OPERATIONS.md](docs/OPERATIONS.md)에 있습니다.

