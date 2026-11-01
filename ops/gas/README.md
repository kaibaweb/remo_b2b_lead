# REMO China Humanoid B2B Lead Generation & GAS Dispatch Engine

Google Apps Script (GAS) 기반 중국 휴머노이드 · Physical AI B2B 아웃바운드 자동화 엔진입니다.
Google Workspace(`remo@boam.tech` / `support@boam.tech`) 및 전용 구글 시트 원장과 연동되어 작동합니다.

## 시스템 아키텍처

```
[Inbound: Vercel Landing Page] ──> Firestore ──> Resend ──> Telegram Alert
                                                                   ▲
[Outbound: GAS Code.gs] ──────────> Google Sheet 원장 ─────────────┤
   ├─ 새벽/저녁 소싱 (04-08시, 19-22시)                               │
   ├─ 주간 5분 간격 순차 발송 (09-20시)                                 │
   └─ 수신함 회신/반송 상시 감시 & 중문 웰컴 자동회신 ──────────────────┘
```

## 연동 리소스

* **원장 구글 시트 ID:** `1dz9shE_3vIY43d7ClaTK6ODpzMCIDRKOZT92HS25b-s`
* **시트 탭 구성 (8개 탭):**
  1. `Config`: 환경설정 (시트가 스크립트의 Source of Truth)
  2. `SourcingPool`: 검증된 중국 휴머노이드·VLA·로봇핸드 타겟 풀
  3. `SourcingQueries`: 6대 타겟군(총 800개사) 검색 쿼리 풀
  4. `Queue`: 발송 대기(`READY`) 및 발송 큐
  5. `DraftBodies`: Dual-Offer(데이터공급 + 한국총판/SI) 맞춤형 중문 HTML 제안서 본문
  6. `Contacts`: 거래처 및 수신자 마스터
  7. `Suppression`: 반송(5.1.1) 및 수신거부 자동 차단 목록
  8. `Events`: 발송, 반송, 웰컴 회신, 텔레그램 일괄 보고 감사 로그
* **텔레그램 알림:** `-4895223660`
* **발신 계정:** `remo@boam.tech` (`support@boam.tech` 별칭 호환)

## 주요 실행 함수

* `remoDispatchStartNow()`: 초기 환경 세팅, 트리거 등록, 큐 적재 및 최초 가동
* `remoSendTestToGitkaiba()`: `gitkaiba@gmail.com`으로 테스트 제안서 즉시 발송 및 텔레그램 검증
* `remoDispatchRun()`: 09:00~20:00 KST 동안 5분 간격 1통씩 순차 발송 (일일 50건 상한)
* `remoRun()`: 5분 간격 수신함 회신·문의·반송 감시 및 중문 웰컴 자동회신
* `remoSourcingRun()`: 새벽 및 저녁 시간대 신규 리드 소싱 및 제안서 큐 적재
* `remoSendTodayBatchReportNow()`: 당일 발송 누적 리포트(🔵발송보고 N건) 즉시 텔레그램 전송
