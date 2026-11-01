# REMO B2B Lead — Asia Physical AI Commercial Network

중국 휴머노이드 · Physical AI(VLA, 로봇핸드, 센서) 기업 대상 B2B 리드 소싱, 양방향 제안(Dual-Offer), 인바운드 접수 및 Google Apps Script(GAS) 자동 발송 시스템입니다.

## 1. 사업 전략 및 포지셔닝 (CHTF 2026 선전 연계)

* **브랜드 포지셔닝:** `Asia Physical AI Commercial Network` (具身智能数据合作 · 跨境市场拓展 · 机器人系统集成)
* **양방향 제안 구조 (Dual-Offer):**
  * **Offer A (Data Supply):** 한국 및 아시아 실환경 다차원 비정형 데이터 + REMO 3D 모션/합성 데이터 공급
  * **Offer B (Market Entry & SI):** 중국 로봇의 한국/아시아 총판, 유료 PoC 추진, 로컬 시스템 통합(SI) 및 AS 지원
* **타겟 모수 (총 800개사):**
  * 중국 휴머노이드 & Embodied AI (250)
  * 로봇핸드, 촉각 센서, VLA 데이터 (150)
  * 산업·물류·서비스 로봇 OEM (150)
  * 중국 수출/SI 파트너 (100)
  * 한국 바이어 및 로봇 SI사 (100)
  * 아시아(싱가포르/대만 등) 파트너 (50)

## 2. 하이브리드 자동화 아키텍처

```
[Inbound (고객 방문)]
  └─ Next.js 랜딩페이지 (Vercel: remob2blead.vercel.app)
       ├─ Firestore: 인바운드 문의 접수 저장 (remo_inbound_leads)
       ├─ Resend: 고객 확인 메일 자동 발송
       └─ Telegram: 신규 문의 실시간 알림

[Outbound (우리가 발굴 및 선제안)]
  ├─ 로컬 안티그래비티 (remo_lead Python CLI): 중국 기업 데이터 소싱 & 스코어링
  └─ Google Apps Script (ops/gas/Code.gs):
       ├─ 구글 시트 원장 관리 (Config, SourcingPool, Queue, DraftBodies, Suppression)
       ├─ remo@boam.tech 계정으로 5분 간격 사람처럼 순차 발송 (1일 50건)
       ├─ 수신함 회신·문의 상시 감시 및 중문 웰컴 양식 자동 답장
       └─ Telegram: 발송 배치 보고(🔵) 및 기업 회신 도착(🟢) 실시간 알림
```

## 3. 디렉토리 구조

```
remo_b2b_lead/
├── ops/
│   └── gas/
│       ├── Code.gs       # REMO GAS 통합 자동 발송·소싱·회신감시 엔진
│       └── README.md     # GAS 원장 시트 및 트리거 가이드
├── remo_lead/            # Python CLI 소싱 & 스코어링 패키지
│   ├── cli.py
│   ├── core.py
│   └── providers.py
├── src/                  # Next.js 웹 CRM & 랜딩페이지 프론트엔드
│   ├── app/
│   └── lib/              # Firebase, Resend, Telegram 클라이언트
└── config.example.json
```

## 공개 페이지 다국어 유지보수

20개 언어의 로케일별 번역, 브라우저 언어 선택 규칙과 검증 절차는 [다국어 운영 매뉴얼](docs/LOCALIZATION.md)에 정리되어 있습니다. 모든 공개 화면 업데이트에 [maintaining-locales 스킬](.agents/skills/maintaining-locales/SKILL.md)을 적용합니다. 빌드 전 자동으로 번역 누락을 검사하며 간체 기본값·브라우저 맞춤·영어 대체 규칙을 유지합니다.
