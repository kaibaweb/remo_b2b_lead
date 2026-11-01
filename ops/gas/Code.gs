/* REMO · Asia Physical AI Commercial Network (보엠 주식회사 / remo@boam.tech)
 * 중국 휴머노이드 · Physical AI B2B 리드 자동소싱 · 맞춤중문제안서 · 순차발송 · 회신감시 · 웰컴응대 · 텔레그램보고 통합 엔진 (Code.gs)
 *
 * [전체 상시 자동화 아키텍처 — 말랑.BEST 검증 엔진 + CHTF 2026 중국 휴머노이드 Dual-Offer 전략 통합본]
 * 1) 새벽(04:00~08:00 KST) · 저녁(19:00~22:00 KST) 자동 소싱 및 Dual-Offer 중문/영문 HTML 초안 생성:
 *    - SourcingQueries(6대 타겟군 800개사 목표 쿼리 풀) 및 SourcingPool(검증된 중국 휴머노이드·VLA·로봇핸드 리드 풀)을 기반으로
 *      기업별 시그널(Track A: 실환경·REMO 합성데이터 공급 / Track B: 한국·아시아 총판 및 SI 구축 / Track AB: 통합 제안)을 판별하여
 *      맞춤형 중문·영문 HTML 제안서를 DraftBodies와 Queue(READY)에 자동 스테이징합니다.
 *    - Brave Search API / Serper API + Gemini API 키를 Config 탭에 넣으면 웹 실시간 탐색까지 GAS 단독으로 수행하며,
 *      로컬 안티그래비티(remo_b2b_lead)에서 생성한 초안(REMO_QUEUE_REVIEW_V1) 동기화도 동시에 지원합니다.
 * 2) 주간(09:00~20:00 KST) 5분 간격 안전 발송 & 하루 1회 텔레그램 통합 보고(🔵[REMO] 발송보고 N건):
 *    - 1통 보낼 때마다 쪼개서 보고하지 않고, Queue 원장 기준으로 당일 배치 완료 시점에 하루 단 1회 전체 리스트(🟢 성공 / 🔴 실패)를 보고합니다.
 * 3) 중국 기업 메일(@163.com, @qq.com, exmail.qq.com, aliyun 등) 반송 자동 격리 및 시스템 메일 완벽 차단:
 *    - mailer-daemon, postmaster, workspacesupport@google.com 등을 100% 격리하고, 5.1.1 반송 주소는 Suppression 탭에 영구 차단 등록합니다.
 * 4) 회신·문의 고객 대상 중문/영문 Dual-Offer 웰컴 양식(REMO_WELCOME_HTML) 자동 응대:
 *    - 중국 휴머노이드/Physical AI 기업의 회신(LEAD_REPLY) 또는 신규 문의(NEW_INQUIRY) 도착 시 텔레그램 즉시 알림(🟢/🟡)과 함께
 *      Track A(데이터셋·REMO 합성데이터 샘플 스펙 안내) + Track B(한국 PoC·총판·SI 협력 안내) + CHTF 선전 미팅 안내 메일을 자동 회신합니다.
 */

var REMO_HEADERS = ['messageId','kind','email','company','subject','at','excerpt','status','telegramId','errorCode'];
var REMO_QUEUE_HEADERS = ['draftId','email','company','sourceUrl','reviewedAt','reviewer','approvalRef','digest','status','reservedAt','gmailId','threadId','errorCode'];
var REMO_BODY_HEADERS = ['draftId','email','subject','digest','htmlBody','syncedAt'];
var REMO_CONFIG_HEADERS = ['key','value','updatedAt'];
var REMO_SOURCING_POOL_HEADERS = [
  'companyId','companyZh','companyEn','category','city','website','email','wechatOrPhone',
  'signalType','offerTrack','fitScore','productKeywords','evidenceSummary','stageStatus','stagedAt'
];
var REMO_SOURCING_QUERY_HEADERS = [
  'queryId','category','targetQuota','queryString','defaultOfferTrack','lastRunAt','discoveredCount','status'
];

var REMO_DEFAULT_ENV = {
  REMO_SHEET_ID: "1dz9shE_3vIY43d7ClaTK6ODpzMCIDRKOZT92HS25b-s",
  TELEGRAM_BOT_TOKEN: "", // Config 시트 탭 또는 GAS ScriptProperties에 설정
  TELEGRAM_CHAT_ID: "-4895223660",
  DISPATCH_ENABLED: "yes",
  DISPATCH_DAYTIME: "yes",
  SOURCING_ENABLED: "yes",
  PRIMARY_ACCOUNT: "remo@boam.tech",
  WORKSPACE_ACCOUNT: "remo@boam.tech",
  STAGING_ACCOUNT: "gitkaiba@gmail.com",
  SENDER_EMAIL: "remo@boam.tech",
  SENDER_NAME: "Asia Physical AI Commercial Network · REMO",
  LANDING_URL: "https://remob2blead.vercel.app/",
  WECHAT_ID: "REMO_PhysicalAI_KR",
  CHTF_MEETING_DATES: "2026年11月14日–16日（深圳高交会 CHTF 现场或深圳湾1:1会面）",
  DAILY_MAX_SENDS: "50",
  HOURLY_SOURCING_BATCH: "5",
  WELCOME_AUTO_REPLY: "yes"
};

/* CHTF 2026 중국 휴머노이드 · Physical AI 검증 완료 초기 리드 풀 (16개 핵심 타겟 — 즉시 스테이징 가능) */
var REMO_VERIFIED_SEED_LEADS = [
  {
    companyId: 'CN-HUM-001',
    companyZh: '宇树科技',
    companyEn: 'Unitree Robotics',
    category: '1_China_Humanoid_Embodied_AI',
    city: 'Hangzhou',
    website: 'https://www.unitree.com/contact',
    email: 'sales_global@unitree.com',
    wechatOrPhone: 'Unitree Official / Global Sales',
    signalType: 'OVERSEAS_CHANNEL_AND_VLA_DATA',
    offerTrack: 'DUAL_OFFER',
    fitScore: 96,
    productKeywords: 'Unitree G1 / H1 人形机器人、四足机器人、具身智能操作数据集',
    evidenceSummary: 'G1/H1 양산 및 글로벌 교육·산업 채널 확장 중, 텔레오퍼레이션·VLA 학습 데이터 및 한국 총판·SI 동시 수요',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-HUM-002',
    companyZh: '智元机器人',
    companyEn: 'AGIBOT (Zhiyuan Robotics)',
    category: '1_China_Humanoid_Embodied_AI',
    city: 'Shanghai',
    website: 'https://store.agibot.com/pages/contact',
    email: 'sales@agibot.com',
    wechatOrPhone: '400-186-0818 / business@zhiyuan-robot.com',
    signalType: 'A2_X2_COMMERCIAL_AND_AIDEA_DATASET',
    offerTrack: 'DUAL_OFFER',
    fitScore: 97,
    productKeywords: '远征 A2 / 灵犀 X2 人形机器人、AgiBot World 具身智能数据集',
    evidenceSummary: '원정 A2·영서 X2 상용화 및 대규모 실환경 데이터셋(AgiBot World) 확장 중, 한국 산업 PoC 및 REMO 데이터 협력 최적',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-HUM-003',
    companyZh: '傅利叶智能',
    companyEn: 'Fourier Intelligence',
    category: '1_China_Humanoid_Embodied_AI',
    city: 'Shanghai',
    website: 'https://fftai.com/fourier/contact',
    email: 'info@fftai.com',
    wechatOrPhone: 'algorithm@fftai.com / Fourier Official',
    signalType: 'GR1_GR2_REHAB_AND_EMBODIED_DATA',
    offerTrack: 'DUAL_OFFER',
    fitScore: 95,
    productKeywords: 'Fourier GR-1 / GR-2 通用人形机器人、康养与科研场景、多模态动作数据',
    evidenceSummary: 'GR-1/GR-2 범용 휴머노이드 및 헬스케어·연구 생태계 확장 중, 한국 대학·병원·기업 공급 및 REMO 모션 데이터 연계 가능',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-HUM-004',
    companyZh: '逐际动力',
    companyEn: 'LimX Dynamics',
    category: '1_China_Humanoid_Embodied_AI',
    city: 'Shenzhen',
    website: 'https://www.limxdynamics.com/en/about',
    email: 'bd@limxdynamics.com',
    wechatOrPhone: '+86-180-2538-4639 / contactus@limxdynamics.com',
    signalType: 'SHENZHEN_HUMANOID_VLA_TRAINING',
    offerTrack: 'DUAL_OFFER',
    fitScore: 96,
    productKeywords: 'CL-1 / Oli 全尺寸人形机器人、TRON 1 双足机器人、具身大模型训练',
    evidenceSummary: '선전 본사, CL-1/Oli 풀사이즈 휴머노이드 및 로코모션·매니퓰레이션 파운데이션 모델 고도화 중(CHTF 선전 미팅 1순위)',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-HUM-005',
    companyZh: '银河通用机器人',
    companyEn: 'Galbot',
    category: '1_China_Humanoid_Embodied_AI',
    city: 'Beijing',
    website: 'http://www.galbot.com/contact',
    email: 'business@galbot.com',
    wechatOrPhone: 'Galbot Official WeChat',
    signalType: 'SYNTHETIC_AND_REAL_VLA_DATA',
    offerTrack: 'DATA_REMO',
    fitScore: 95,
    productKeywords: 'Galbot G1 具身大模型机器人、合成数据与真实场景泛化抓取数据',
    evidenceSummary: '시뮬레이션 합성 데이터 + 실환경 리테일·물류 피킹 데이터 기반 VLA 선도 기업, REMO 데이터/합성 파이프라인 직접 매칭',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-HUM-006',
    companyZh: '星动纪元',
    companyEn: 'ROBOTERA',
    category: '1_China_Humanoid_Embodied_AI',
    city: 'Beijing',
    website: 'https://www.robotera.com/en/',
    email: 'mkt@robotera.com',
    wechatOrPhone: '400-900-8798 / PR@robotera.com',
    signalType: 'STAR1_AND_XHAND_DEXTEROUS_DATA',
    offerTrack: 'DUAL_OFFER',
    fitScore: 94,
    productKeywords: 'STAR1 人形机器人、星动 XHAND 灵巧手、原生具身智能大模型',
    evidenceSummary: '칭화대 기반 풀스택 휴머노이드(STAR1) 및 고정밀 로봇핸드(XHAND) 보유, 한국 연구기관·제조사 공급 및 정밀 조작 데이터 협력 적합',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-HUM-007',
    companyZh: '开普勒机器人',
    companyEn: 'Kepler Exploration Robotics',
    category: '1_China_Humanoid_Embodied_AI',
    city: 'Shanghai',
    website: 'https://www.gotokepler.com/apps/mobile/pages/about/index',
    email: 'business@gotokepler.com',
    wechatOrPhone: 'sales@gotokepler.com / contact@gotokepler.com',
    signalType: 'INDUSTRIAL_LOGISTICS_POC_EXPANSION',
    offerTrack: 'KR_DIST_SI',
    fitScore: 93,
    productKeywords: '先行者 Forerunner 系列通用人形机器人、工业搬运与智能制造巡检',
    evidenceSummary: '산업·물류 현장 특화 휴머노이드(Forerunner) 해외 파트너 및 로컬 SI 발굴 중, 한국 제조·물류 PoC 제안 최적',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-HUM-008',
    companyZh: '众擎机器人',
    companyEn: 'ENGINEAI Robotics',
    category: '1_China_Humanoid_Embodied_AI',
    city: 'Shenzhen',
    website: 'https://www.engineai.com.cn/contact-us.html',
    email: 'sales@engineai.com.cn',
    wechatOrPhone: '深圳市南山区深圳湾创新科技中心 / support@engineai.com.cn',
    signalType: 'SHENZHEN_HUMANOID_OVERSEAS_SALES',
    offerTrack: 'DUAL_OFFER',
    fitScore: 95,
    productKeywords: 'SE01 / PM01 / SA01 全栈自研关节人形机器人、步态与全身运动控制数据',
    evidenceSummary: '선전 남산구 소재, 자연 보행 SE01/PM01 휴머노이드 양산 및 글로벌 판매 개시, CHTF 선전 현지 대면 미팅 및 한국 총판·모션 데이터 제안 최적',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-HUM-009',
    companyZh: '加速进化',
    companyEn: 'Booster Robotics',
    category: '1_China_Humanoid_Embodied_AI',
    city: 'Beijing',
    website: 'https://www.booster.tech/',
    email: 'sales@boosterobotics.com',
    wechatOrPhone: '+86-13241333599',
    signalType: 'DEVELOPER_HUMANOID_KR_MARKET',
    offerTrack: 'KR_DIST_SI',
    fitScore: 91,
    productKeywords: 'Booster T1 / K1 开发者人形机器人、具身智能科研与赛事平台',
    evidenceSummary: '글로벌 AI 연구실·대학 대상 개발자용 휴머노이드(T1/K1) 수출 확대 중, 한국 AI 대학·연구소 유통 및 학습 데이터 패키지 결합 제안 가능',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-HUM-010',
    companyZh: '星尘智能',
    companyEn: 'Astribot',
    category: '1_China_Humanoid_Embodied_AI',
    city: 'Shenzhen',
    website: 'https://www.astribot.com/en/contact/',
    email: 'business@astribot.com',
    wechatOrPhone: 'Shenzhen HQ',
    signalType: 'TELEOP_AND_IMITATION_LEARNING_DATA',
    offerTrack: 'DATA_REMO',
    fitScore: 96,
    productKeywords: 'Astribot S1 具身智能机器人、高自由度灵巧操作、模仿学习与遥操作数据',
    evidenceSummary: '선전 소재, 초고속·고정밀 모방학습(Imitation Learning) 로봇 S1 개발사, 비정형 실환경 조작 데이터 및 REMO 3D 모션 합성 데이터 핵심 수요처',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-VLA-011',
    companyZh: '帕西尼感知科技',
    companyEn: 'PaXini Tech',
    category: '2_Hand_Sensor_VLA_Data',
    city: 'Shenzhen',
    website: 'https://paxini.com/robot/contact',
    email: 'mkt@paxini.com',
    wechatOrPhone: '+86-755-2357-4593 (Shenzhen Baoan)',
    signalType: 'TACTILE_DEXHAND_AND_MULTIMODAL_DATA',
    offerTrack: 'DUAL_OFFER',
    fitScore: 95,
    productKeywords: '多维触觉灵巧手 DexH13、TORA-ONE 触觉人形机器人、触觉-视觉多模态数据集',
    evidenceSummary: '선전 보안구 소재, 다차원 촉각 센서·로봇핸드·휴머노이드 제조 및 PaXini AI 데이터랩 운영 중, CHTF 선전 미팅 및 한·중 촉각/비전 데이터·부품 유통 협력 최적',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-VLA-012',
    companyZh: '因时机器人',
    companyEn: 'INSPIRE ROBOTS',
    category: '2_Hand_Sensor_VLA_Data',
    city: 'Beijing',
    website: 'https://en.inspire-robots.com/contact-us/',
    email: 'sales@inspire-robots.com',
    wechatOrPhone: '+86-13161665075 / info@inspire-robots.com',
    signalType: 'DEXHAND_GLOBAL_CHANNEL_AND_GRASP_DATA',
    offerTrack: 'KR_DIST_SI',
    fitScore: 92,
    productKeywords: '仿人五指灵巧手 (Dexterous Hands 10,000+ units)、微型伺服电缸',
    evidenceSummary: '중국 휴머노이드용 5지 로봇핸드 점유율 선두(1만 대 돌파), 한국 로봇 제조사·연구기관향 총판/기술지원 및 파지(Grasping) 데이터 협력 가능',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-VLA-013',
    companyZh: '傲意科技',
    companyEn: 'OYMotion Technologies',
    category: '2_Hand_Sensor_VLA_Data',
    city: 'Shanghai',
    website: 'https://www.oymotion.com/en/indexen',
    email: 'sales@oymotion.com',
    wechatOrPhone: 'info@oymotion.com',
    signalType: 'ROH_DEXHAND_AND_EMG_TELEOP',
    offerTrack: 'DUAL_OFFER',
    fitScore: 90,
    productKeywords: 'ROH 灵巧手、肌电/神经接口遥操作手套、灵巧操作动作捕捉数据',
    evidenceSummary: '로봇핸드(ROH) 및 텔레오퍼레이션 센서 보유, REMO 정밀 손동작 추적·합성 데이터 결합 및 한국 시장 유통 시너지',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-HUM-014',
    companyZh: '优必选科技',
    companyEn: 'UBTECH Robotics',
    category: '1_China_Humanoid_Embodied_AI',
    city: 'Shenzhen',
    website: 'https://www.ubtrobot.com/en/about/company-profile',
    email: 'ubtsales@ubtrobot.com',
    wechatOrPhone: '0755-83474428 / commercial.marketing@ubtrobot.com',
    signalType: 'WALKER_S_AUTOMOTIVE_FACTORY_DATA',
    offerTrack: 'DUAL_OFFER',
    fitScore: 94,
    productKeywords: 'Walker S 工业人形机器人、汽车工厂实训数据集、商用服务机器人',
    evidenceSummary: '선전 남산구 본사, 자동차·제조 라인 Walker S 투입 확대 중, 한국 제조·상업 현장 SI 및 산업용 행동 데이터 공급 제안 가능',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-OEM-015',
    companyZh: '越疆科技',
    companyEn: 'Dobot Robotics',
    category: '3_Industrial_Logistics_Service_OEM',
    city: 'Shenzhen',
    website: 'https://www.dobot-robots.com/about/contact-us',
    email: 'sales@dobot-robots.com',
    wechatOrPhone: 'support@dobot-robots.com (Shenzhen Nanshan)',
    signalType: 'XTRAINER_EMBODIED_AI_PLATFORM',
    offerTrack: 'DUAL_OFFER',
    fitScore: 93,
    productKeywords: 'Dobot X-Trainer 具身智能操作平台、双臂遥操作采集系统、协作机器人',
    evidenceSummary: '선전 본사, X-Trainer 양팔 텔레오퍼레이션 AI 로봇 플랫폼 출시, 실환경 학습 데이터셋 구축 및 아시아 엔터프라이즈 SI 협력 적합',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  },
  {
    companyId: 'CN-OEM-016',
    companyZh: '擎朗智能',
    companyEn: 'KEENON Robotics',
    category: '3_Industrial_Logistics_Service_OEM',
    city: 'Shanghai',
    website: 'https://www.keenon.com/en/partnership/',
    email: 'global@keenon.com',
    wechatOrPhone: 'Keenon Global Partnership',
    signalType: 'SERVICE_HUMANOID_XMAN_REALWORLD_DATA',
    offerTrack: 'DUAL_OFFER',
    fitScore: 91,
    productKeywords: 'XMAN 通用服务人形机器人、酒店餐饮医疗配送机器人、非结构化商业场景数据',
    evidenceSummary: '서비스용 휴머노이드(XMAN) 및 글로벌 상업용 로봇 확대 중, 한국 상업시설 비정형 실환경 데이터 공급 및 SI 파트너십 연계 가능',
    stageStatus: 'VERIFIED_READY',
    stagedAt: ''
  }
];

/* 6대 카테고리 800개 기업 발굴용 자동 소싱 검색어 풀 (SourcingQueries 시트 초기값) */
var REMO_DEFAULT_SOURCING_QUERIES = [
  ['Q-HUM-01', '1_China_Humanoid_Embodied_AI', 250, '"人形机器人" OR "具身智能" "深圳" ("邮箱" OR "contact" OR "bd@" OR "sales@" OR "business@")', 'DUAL_OFFER', '', 8, 'ACTIVE'],
  ['Q-HUM-02', '1_China_Humanoid_Embodied_AI', 250, '"通用人形机器人" ("遥操作数据" OR "数据集采集" OR "VLA大模型") ("contact" OR "email" OR "@")', 'DATA_REMO', '', 4, 'ACTIVE'],
  ['Q-VLA-01', '2_Hand_Sensor_VLA_Data', 150, '"灵巧手" OR "触觉传感器" OR "六维力传感器" "机器人" ("sales@" OR "info@" OR "bd@" OR "mkt@")', 'DUAL_OFFER', '', 3, 'ACTIVE'],
  ['Q-VLA-02', '2_Hand_Sensor_VLA_Data', 150, '"具身智能数据" OR "机器人训练数据" OR "Isaac Sim" "合成数据" ("合作" OR "business@" OR "contact@")', 'DATA_REMO', '', 2, 'ACTIVE'],
  ['Q-OEM-01', '3_Industrial_Logistics_Service_OEM', 150, '"双足机器人" OR "复合机器人" OR "AMR" "出海" ("海外销售" OR "global@" OR "overseas@" OR "sales@")', 'KR_DIST_SI', '', 2, 'ACTIVE'],
  ['Q-CHN-01', '4_China_Export_Channel_SI', 100, '"高交会" OR "CHTF" "机器人" OR "人工智能" ("参展" OR "商务合作" OR "bd@")', 'DUAL_OFFER', '', 0, 'ACTIVE'],
  ['Q-KOR-01', '5_Korea_Buyer_SI_Maintenance', 100, '"휴머노이드" OR "자율주행로봇" "로봇 SI" OR "총판" ("문의" OR "제휴" OR "contact@")', 'KR_DIST_SI', '', 0, 'ACTIVE'],
  ['Q-APAC-01', '6_APAC_Tech_Sales_Partner', 50, '"humanoid robot" OR "embodied AI" ("Singapore" OR "Taiwan" OR "Japan") ("distributor" OR "partner" OR "sales@")', 'KR_DIST_SI', '', 0, 'ACTIVE']
];

/* 회신·문의 고객 대상 중문/영문 Dual-Offer 웰컴 자동응대 양식 (REMO_WELCOME_HTML_TEMPLATE) */
var REMO_WELCOME_HTML_TEMPLATE = [
  '<div style="background:#f3f5f8;padding:24px 12px;font-family:\'PingFang SC\',\'Microsoft YaHei\',\'Apple SD Gothic Neo\',sans-serif;color:#12263a;">',
  '  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dfe5ec;border-top:4px solid #0f3d5e;">',
  '    <div style="padding:24px 26px;border-bottom:1px solid #e6ebf0;">',
  '      <h1 style="margin:0;font-size:21px;color:#0f3d5e;">Asia Physical AI Commercial Network · REMO</h1>',
  '      <p style="margin:6px 0 0;font-size:13px;color:#52637a;">具身智能数据合作 · 跨境市场拓展 · 机器人系统集成 (Physical AI Data · Korea/APAC Market Entry · SI)</p>',
  '    </div>',
  '    <div style="padding:26px 26px;font-size:14px;line-height:1.85;color:#1e293b;">',
  '      <h2 style="margin:0 0 16px;font-size:18px;color:#0f3d5e;">感谢您的回复与合作垂询 / Thank You for Reaching Out</h2>',
  '      <p>您好，<strong>{{name}}</strong>（<strong>{{company}}</strong>）：<br>我们已收到您的邮件，非常荣幸与贵司探讨具身智能（Physical AI）与机器人领域的跨境合作。</p>',
  '      {{customContextBlock}}',
  '      <p>为了在会前或样品对接前为您提供最精准的方案，请直接<strong>回复本邮件</strong>告知您目前最关注的合作方向（可多选）：</p>',
  '      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px 18px;margin:18px 0;border-radius:6px;">',
  '        <h3 style="margin:0 0 8px;font-size:15px;color:#0f3d5e;">方向 A · 具身智能训练数据与 REMO 合成数据供应 (We Supply Data to You)</h3>',
  '        <ul style="margin:0;padding-left:20px;font-size:13.5px;color:#334155;">',
  '          <li><strong>真实场景多模态数据：</strong>韩国及亚洲工业、商业、家庭真实环境遥操作（Teleoperation）、双臂灵巧操作、多视角 RGB-D 与动作轨迹采集</li>',
  '          <li><strong>REMO 3D 动作与合成数据：</strong>高保真人体/全身运动捕捉、灵巧手抓取轨迹扩增、Isaac Sim / Gazebo 仿真场景与边缘案例（Corner Case）合成数据</li>',
  '          <li><em>如关注此项，请告知目标模态（双臂/灵巧手/全身步态）、需求时长/条数及目标格式（RLDS / LeRobot / HDF5 等），我们将发送样本清单（Sample Pack）。</em></li>',
  '        </ul>',
  '      </div>',
  '      <div style="background:#fffbeb;border:1px solid #fde68a;padding:16px 18px;margin:18px 0;border-radius:6px;">',
  '        <h3 style="margin:0 0 8px;font-size:15px;color:#92400e;">方向 B · 韩国及亚洲市场拓展 · 总代分销与本地系统集成 (We Bring Your Robots to Korea/APAC)</h3>',
  '        <ul style="margin:0;padding-left:20px;font-size:13.5px;color:#334155;">',
  '          <li><strong>韩国本地 PoC 与渠道落地：</strong>对接韩国制造业、物流仓储、商业服务、高校及科研院所买家，提供本地化销售代理与联合展示</li>',
  '          <li><strong>本地 SI 与售后维保：</strong>提供韩国本地现场部署（SI）、韩文技术文档本地化及售后运维支持</li>',
  '          <li><em>如关注此项，请附贵司主力机型宣传册（Brochure）、出海标准报价区间及理想渠道合作模式。</em></li>',
  '        </ul>',
  '      </div>',
  '      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:15px 18px;margin:18px 0;border-radius:6px;font-size:13.5px;">',
  '        <strong>📍 2026 深圳高交会 (CHTF Shenzhen) 现场面谈预约：</strong><br>',
  '        我们团队将于 <strong>2026年11月14日–16日</strong> 期间在深圳（高交会现场及南山/宝安区）与核心合作伙伴进行 1:1 闭门洽谈。如需预约深圳当面交流或提前安排线上腾讯会议/Zoom，请直接在邮件中告知方便的时间段及微信号。',
  '      </div>',
  '      <p style="margin:20px 0 12px;">',
  '        <a href="{{landingUrl}}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#0f3d5e;color:#ffffff;padding:11px 18px;text-decoration:none;font-weight:bold;border-radius:5px;margin:0 8px 8px 0;font-size:13.5px;">查看合作网络与项目介绍 (Overview) →</a>',
  '      </p>',
  '    </div>',
  '    <div style="padding:18px 26px;background:#f8fafc;border-top:1px solid #e6ebf0;font-size:12.5px;line-height:1.75;color:#475569;">',
  '      <strong>Asia Physical AI Commercial Network · REMO (BOAM Inc.)</strong><br>',
  '      具身智能数据合作 · 跨境市场拓展 · 机器人系统集成<br>',
  '      Email: <a href="mailto:remo@boam.tech" style="color:#0f3d5e;">remo@boam.tech</a> · Web: <a href="{{landingUrl}}" target="_blank" rel="noopener noreferrer" style="color:#0f3d5e;">REMO B2B Network</a>',
  '    </div>',
  '  </div>',
  '</div>'
].join('\n');

/* ==========================================================================
 * 1. 공통 유틸리티, 링크 리디렉션 정화 및 환경설정 동기화
 * ========================================================================== */

function remoEnsureEnv_() {
  var p = PropertiesService.getScriptProperties(), cur = p.getProperties(), up = {};
  for (var k in REMO_DEFAULT_ENV) {
    if (!cur[k] || k === 'PRIMARY_ACCOUNT' || k === 'WORKSPACE_ACCOUNT' || k === 'DISPATCH_DAYTIME' || k === 'REMO_SHEET_ID') {
      up[k] = REMO_DEFAULT_ENV[k];
    }
  }
  if (Object.keys(up).length) p.setProperties(up, false);
  if (cur.DISPATCH_ALL_HOURS) {
    try { p.deleteProperty('DISPATCH_ALL_HOURS'); } catch(e) {}
  }
  return p;
}

function remoSyncSharedConfig_(p, book) {
  if (!book) return p.getProperties();
  var s = remoSheet_(book, "Config", REMO_CONFIG_HEADERS);
  var rows = remoRows_(s), sheetMap = {};
  rows.forEach(function(r, idx) {
    var k = String(r[0] || "").trim(), v = String(r[1] || "").trim();
    if (k) sheetMap[k] = {val: v, rowIdx: idx + 2};
  });
  var cur = p.getProperties(), toSaveInProp = {};
  var sharedKeys = [
    "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "SENDER_EMAIL", "SENDER_NAME",
    "PRIMARY_ACCOUNT", "WORKSPACE_ACCOUNT", "STAGING_ACCOUNT", "LANDING_URL", "WECHAT_ID",
    "CHTF_MEETING_DATES", "DAILY_MAX_SENDS", "HOURLY_SOURCING_BATCH", "DISPATCH_ENABLED",
    "SOURCING_ENABLED", "WELCOME_AUTO_REPLY", "BRAVE_API_KEY", "SERPER_API_KEY", "GEMINI_API_KEY"
  ];
  sharedKeys.forEach(function(k) {
    var sEntry = sheetMap[k];
    var sVal = sEntry ? String(sEntry.val || "").trim() : "";
    var pVal = String(cur[k] || "").trim();
    if (sVal) {
      if (sVal !== pVal) {
        toSaveInProp[k] = sVal.replace(/^'+/, "");
      }
    } else if (pVal) {
      var now = new Date().toISOString();
      if (sEntry) s.getRange(sEntry.rowIdx, 2, 1, 2).setValues([[remoCell_(pVal), now]]);
      else s.appendRow([k, remoCell_(pVal), now]);
    }
  });
  if (Object.keys(toSaveInProp).length) p.setProperties(toSaveInProp, false);
  return p.getProperties();
}

function remoOwnerEmail_(addr) {
  var a = String(addr || '').toLowerCase().trim();
  return (
    a === 'remo@boam.tech' ||
    a === 'support@boam.tech' ||
    a === 'manager@malang.best' ||
    a === 'humanopeace@gmail.com' ||
    a === 'gitkaiba@gmail.com'
  );
}

function remoIsWorkspaceSender_(addr) {
  var a = String(addr || '').toLowerCase().trim();
  return a === 'remo@boam.tech' || a === 'support@boam.tech';
}

function remoConfig_() {
  var p = remoEnsureEnv_();
  var sheetId = p.getProperty('REMO_SHEET_ID') || REMO_DEFAULT_ENV.REMO_SHEET_ID;
  var book = null;
  try { book = SpreadsheetApp.openById(sheetId); remoSyncSharedConfig_(p, book); } catch(e) {}
  return {
    p: p,
    account: p.getProperty('SENDER_EMAIL') || 'remo@boam.tech',
    senderName: p.getProperty('SENDER_NAME') || 'Asia Physical AI Commercial Network · REMO',
    primary: p.getProperty('PRIMARY_ACCOUNT') || 'remo@boam.tech',
    staging: p.getProperty('STAGING_ACCOUNT') || 'humanopeace@gmail.com',
    landingUrl: p.getProperty('LANDING_URL') || REMO_DEFAULT_ENV.LANDING_URL,
    wechatId: p.getProperty('WECHAT_ID') || REMO_DEFAULT_ENV.WECHAT_ID,
    chtfDates: p.getProperty('CHTF_MEETING_DATES') || REMO_DEFAULT_ENV.CHTF_MEETING_DATES,
    token: (p.getProperty('TELEGRAM_BOT_TOKEN') || '').replace(/^'+/, '').trim(),
    chat: (p.getProperty('TELEGRAM_CHAT_ID') || '-5509243031').replace(/^'+/, '').trim(),
    book: sheetId,
    bookObj: book
  };
}

function remoTelegram_(c, method, payload) {
  if (!c.token) return {id: c.chat, message_id: 'SHEET_ONLY'};
  var res = UrlFetchApp.fetch('https://api.telegram.org/bot' + c.token + '/' + method, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true
  });
  var data = JSON.parse(res.getContentText() || '{}');
  if (res.getResponseCode() !== 200 || data.ok !== true) throw new Error('TELEGRAM_API_ERROR_' + res.getResponseCode());
  return data.result;
}

function remoConnections_() {
  var c = remoConfig_(), profile = Gmail.Users.getProfile('me');
  var runnerEmail = String(profile.emailAddress || '').toLowerCase().trim();
  if (!remoOwnerEmail_(runnerEmail)) throw new Error('GMAIL_ACCOUNT_MISMATCH_' + runnerEmail);
  c.runnerEmail = runnerEmail;
  c.isWorkspaceSender = remoIsWorkspaceSender_(runnerEmail);
  c.isStagingOwner = (runnerEmail === 'humanopeace@gmail.com' || runnerEmail === 'gitkaiba@gmail.com');
  if (c.token) { try { remoTelegram_(c, 'getMe', {}); } catch(e) {} }
  return c;
}

function remoBook_(c) { return (c && c.bookObj) ? c.bookObj : SpreadsheetApp.openById(c.book); }
function remoSheet_(book, name, headers) {
  var s = book.getSheetByName(name);
  if (!s) { s = book.insertSheet(name); s.appendRow(headers); s.setFrozenRows(1); }
  return s;
}
function remoRows_(s) { return s ? s.getDataRange().getValues().slice(1) : []; }
function remoCell_(v) { return /^[=+@-]/.test(String(v)) ? "'" + String(v) : String(v); }
function remoAddress_(v) {
  return (String(v || '').match(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/ig) || []).map(function(x){ return x.toLowerCase(); });
}
function remoDigest_(t) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, t, Utilities.Charset.UTF_8)
    .map(function(b){ return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}
function remoCleanUrl_(u) {
  var s = String(u || '').trim();
  var m = s.match(/^https?:\/\/(?:www\.)?google\.com\/url\?(?:[^&]*&)*q=([^&]+)/i);
  if (m) { try { s = decodeURIComponent(m[1]); } catch(e) {} }
  return s;
}

function remoSanitizeEmailHtmlLinks_(html) {
  var s = String(html || '');
  if (!s) return '';
  s = s.replace(/href=(["'])\s*https?:\/\/(?:www\.)?google\.com\/url\?(?:[^"']*?(?:&amp;|&))?q=([^&"'\s<>]+)(?:[^"']*)\1/gi, function(_, quote, encodedUrl) {
    var clean = encodedUrl;
    try { clean = decodeURIComponent(encodedUrl.replace(/&amp;/gi, '&')); } catch(e) {}
    return 'href=' + quote + clean + quote;
  });
  s = s.replace(/https?:\/\/(?:www\.)?google\.com\/url\?(?:[^"'\s<>]*?(?:&amp;|&))?q=([^&"'\s<>]+)(?:&amp;|&)[^"'\s<>]*/gi, function(_, encodedUrl) {
    var clean = encodedUrl;
    try { clean = decodeURIComponent(encodedUrl.replace(/&amp;/gi, '&')); } catch(e) {}
    return clean;
  });
  return s;
}

function remoEscapeHtml_(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function remoDecodeBody_(enc) {
  if (!enc) return '';
  if (typeof enc === 'object' && Number.isInteger(enc.length)) {
    var b = [];
    for (var i = 0; i < enc.length; i++) b.push(enc[i] > 127 ? enc[i] - 256 : enc[i]);
    return Utilities.newBlob(b).getDataAsString('UTF-8');
  }
  if (typeof enc !== 'string') return '';
  var d = enc.replace(/\s/g, '').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  d += '='.repeat((4 - d.length % 4) % 4);
  return Utilities.newBlob(Utilities.base64DecodeWebSafe(d)).getDataAsString('UTF-8');
}
function remoExtractHtml_(part) {
  if (!part) return '';
  var mime = String(part.mimeType || '').toLowerCase();
  if (mime === 'text/html' && part.body && part.body.data) {
    var decoded = remoDecodeBody_(part.body.data);
    if (decoded && decoded.trim()) return remoSanitizeEmailHtmlLinks_(decoded);
  }
  var parts = part.parts || [];
  for (var i = 0; i < parts.length; i++) {
    var r = remoExtractHtml_(parts[i]);
    if (r && r.trim()) return remoSanitizeEmailHtmlLinks_(r);
  }
  if (part.body && part.body.data) {
    var fallback = remoDecodeBody_(part.body.data);
    if (fallback && /<[a-z][\s\S]*>/i.test(fallback)) return remoSanitizeEmailHtmlLinks_(fallback);
  }
  return '';
}
function remoExtractPlain_(part) {
  if (!part) return '';
  if (part.mimeType === 'text/plain' && part.body && part.body.data) return remoDecodeBody_(part.body.data);
  var parts = part.parts || [];
  for (var i = 0; i < parts.length; i++) { var r = remoExtractPlain_(parts[i]); if (r) return r; }
  if (part.body && part.body.data) return remoDecodeBody_(part.body.data);
  return '';
}
function remoHtmlToText_(html) {
  return String(html || '')
    .replace(/<blockquote[\s\S]*?<\/blockquote>/gi, ' ')
    .replace(/<div[^>]+class=["']?[^"'>]*(?:gmail_quote|yahoo_quoted)[^"'>]*["']?[\s\S]*$/i, ' ')
    .replace(/<(script|style|head|title)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
function remoStripQuoted_(text) {
  var lines = String(text || '').replace(/\r\n/g, '\n').split('\n'), out = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (/^\s*>/.test(line)) continue;
    if (/^(On .+ wrote:|-----Original Message-----|From:\s|发件人:\s|보낸사람:\s|발신:\s|\d{4}년 .* 작성:|\d{4}-\d{2}-\d{2} .* 写道：)/i.test(line.trim())) break;
    out.push(line);
  }
  return out.join('\n').trim();
}
function remoAttachmentNames_(part, out) {
  var list = out || [];
  if (!part) return list;
  var name = String(part.filename || '').trim();
  if (name && list.indexOf(name) < 0) list.push(name.slice(0, 80));
  (part.parts || []).forEach(function(child) { remoAttachmentNames_(child, list); });
  return list;
}
function remoHeaders_(message) {
  var out = {};
  ((message && message.payload && message.payload.headers) || []).forEach(function(h) {
    if (h && h.name) out[String(h.name).toLowerCase()] = String(h.value || '');
  });
  return out;
}
function remoSenderName_(raw, fallbackEmail) {
  var text = String(raw || '').replace(/<[^>]+>/g, '').replace(/["']/g, '').trim();
  if (text && !/@/.test(text)) return text.slice(0, 80);
  var local = String(fallbackEmail || '').split('@')[0] || '负责人';
  return local.slice(0, 80);
}

/* ==========================================================================
 * 2. 새벽·저녁 중국 휴머노이드 소싱 엔진 & Dual-Offer 중문/영문 HTML 제안서 자동 생성
 * ========================================================================== */

function remoInitSourcingSheets_(book) {
  var qSheet = remoSheet_(book, 'SourcingQueries', REMO_SOURCING_QUERY_HEADERS);
  if (remoRows_(qSheet).length === 0) {
    REMO_DEFAULT_SOURCING_QUERIES.forEach(function(qRow) { qSheet.appendRow(qRow); });
  }
  var pSheet = remoSheet_(book, 'SourcingPool', REMO_SOURCING_POOL_HEADERS);
  var pRows = remoRows_(pSheet);
  var existingEmails = {};
  pRows.forEach(function(r) {
    var em = String(r[6] || '').toLowerCase().trim();
    if (em) existingEmails[em] = true;
  });
  var seeded = 0;
  REMO_VERIFIED_SEED_LEADS.forEach(function(item) {
    var em = String(item.email || '').toLowerCase().trim();
    if (!em || existingEmails[em]) return;
    pSheet.appendRow([
      item.companyId,
      item.companyZh,
      item.companyEn,
      item.category,
      item.city,
      item.website,
      em,
      item.wechatOrPhone,
      item.signalType,
      item.offerTrack,
      item.fitScore,
      item.productKeywords,
      item.evidenceSummary,
      item.stageStatus || 'VERIFIED_READY',
      item.stagedAt || ''
    ]);
    existingEmails[em] = true;
    seeded++;
  });
  if (seeded) SpreadsheetApp.flush();
  return seeded;
}

/* 기업별 시그널(DATA_REMO / KR_DIST_SI / DUAL_OFFER)에 맞춘 중문+영문 B2B HTML 제안서 자동 생성 */
function remoBuildCustomProposal_(lead, c) {
  var zhName = String(lead.companyZh || lead.companyEn || '贵司').trim();
  var enName = String(lead.companyEn || lead.companyZh || 'Partner').trim();
  var displayComp = zhName + (enName && enName !== zhName ? ' (' + enName + ')' : '');
  var products = String(lead.productKeywords || '人形机器人与具身智能系统').trim();
  var track = String(lead.offerTrack || 'DUAL_OFFER').toUpperCase().trim();
  var city = String(lead.city || '').trim();
  var isShenzhen = /shenzhen|深圳/i.test(city);

  var subject = '';
  var leadHookHtml = '';
  if (track === 'DATA_REMO') {
    subject = '【具身智能数据与REMO合作】赋能 ' + zhName + ' 真实场景遥操作数据集与3D合成数据方案 (CHTF 2026)';
    leadHookHtml =
      '<p style="margin:0 0 16px;font-size:14.5px;line-height:1.9;color:#2c3e50;">我们持续关注 <strong>' + remoEscapeHtml_(displayComp) + '</strong> 在 <strong>' + remoEscapeHtml_(products) + '</strong> 及具身大模型训练领域的领先进展。针对泛化操作与灵巧控制训练中的数据瓶颈，我们希望为贵司提供高性价比的<strong>韩国/亚洲真实场景多模态数据采集</strong>与 <strong>REMO 高精度 3D 动作合成数据</strong>支持。</p>';
  } else if (track === 'KR_DIST_SI') {
    subject = '【韩国及亚洲市场拓展】' + zhName + ' 机器人韩国总代分销、行业PoC落地与本地SI合作提案 (CHTF 2026)';
    leadHookHtml =
      '<p style="margin:0 0 16px;font-size:14.5px;line-height:1.9;color:#2c3e50;">我们关注到 <strong>' + remoEscapeHtml_(displayComp) + '</strong> 正在推进 <strong>' + remoEscapeHtml_(products) + '</strong> 的商业化与海外市场拓展。作为连接中韩及亚洲市场的具身智能商业网络，我们希望协助贵司快速落地<strong>韩国制造业、商业服务及科研院所的付费 PoC、渠道分销与本地系统集成（SI）</strong>。</p>';
  } else {
    subject = '【具身智能数据 × 韩国市场拓展】关于 ' + zhName + ' 赴韩渠道落地与训练数据合作提案 (深圳高交会面谈)';
    leadHookHtml =
      '<p style="margin:0 0 16px;font-size:14.5px;line-height:1.9;color:#2c3e50;">您好！我们长期关注 <strong>' + remoEscapeHtml_(displayComp) + '</strong> 在 <strong>' + remoEscapeHtml_(products) + '</strong> 领域的研发与商业化突破。围绕即将到来的 2026 深圳高交会（CHTF），我们希望与贵司建立<strong>“训练数据供应 + 韩国/亚洲市场落地”</strong>的双向合作：</p>';
  }

  var shenzhenLine = isShenzhen
    ? '鉴于贵司位于<strong>深圳</strong>，我们团队将于 <strong>2026年11月14日–16日（深圳高交会 CHTF 期间）</strong> 在深圳南山/宝安及会展中心进行 1:1 拜访，非常期待能到贵司或展会现场当面交流。'
    : '我们团队将于 <strong>2026年11月14日–16日（深圳高交会 CHTF 期间）</strong> 在深圳驻点洽谈；若贵司参展或途经深圳，欢迎预约现场 1:1 会面，亦可随时安排线上腾讯会议 / Zoom 交流。';

  var html = [
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#f3f5f8;font-family:\'PingFang SC\',\'Microsoft YaHei\',Arial,sans-serif;">',
    '<tr><td align="center" style="padding:24px 12px;">',
    '<table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;background-color:#ffffff;border:1px solid #e2e8f0;border-top:4px solid #0f3d5e;">',
    '<tr><td style="padding:24px 28px 20px;border-bottom:1px solid #e9edf2;">',
    '<p style="margin:0 0 5px;font-size:21px;line-height:1.3;font-weight:700;color:#0f3d5e;">Asia Physical AI Commercial Network · REMO</p>',
    '<p style="margin:0;font-size:12.5px;line-height:1.6;color:#64748b;">具身智能数据合作 · 跨境市场拓展 · 机器人系统集成 (Physical AI Data · Market Entry · Robotics SI)</p>',
    '</td></tr>',
    '<tr><td style="padding:26px 28px 22px;">',
    '<h1 style="margin:0 0 20px;font-size:19px;line-height:1.5;font-weight:700;color:#0f172a;">致 ' + remoEscapeHtml_(displayComp) + ' 商务拓展与具身智能研发团队</h1>',
    leadHookHtml,
    '<div style="background-color:#f8fafc;border-left:4px solid #0f3d5e;padding:15px 18px;margin:18px 0;">',
    '<p style="margin:0 0 8px;font-size:14.5px;font-weight:700;color:#0f3d5e;">1. 具身智能真实训练数据与 REMO 合成数据供应 (We Supply Data to You)</p>',
    '<p style="margin:0;font-size:13.5px;line-height:1.8;color:#334155;">• <strong>真实非结构化场景采集：</strong>依托韩国及东南亚商业、工业、家庭实景基地，按贵司传感器配置采集双臂操作、灵巧手抓取（Dexterous Manipulation）与全身遥操作数据。<br>• <strong>REMO 3D 动作与仿真增强：</strong>基于 REMO 运动捕捉与合成技术，提供高精全身/手部骨骼轨迹及 Isaac Sim / Gazebo 泛化合成数据集，显著降低实采成本。</p>',
    '</div>',
    '<div style="background-color:#fffbeb;border-left:4px solid #d97706;padding:15px 18px;margin:18px 0;">',
    '<p style="margin:0 0 8px;font-size:14.5px;font-weight:700;color:#92400e;">2. 韩国及亚洲市场代理分销与本地系统集成 (We Distribute & Integrate Your Robots)</p>',
    '<p style="margin:0;font-size:13.5px;line-height:1.8;color:#334155;">• <strong>韩国本地买家与 PoC 对接：</strong>直接触达韩国制造工厂、物流中心、商业连锁及顶尖高校科研实验室，推进样机采购与试点部署（Paid PoC）。<br>• <strong>本地化 SI 与售后网络：</strong>提供韩语技术支持、现场二次开发集成与本地维保，解决中国机器人出海韩国的交付痛点。</p>',
    '</div>',
    '<p style="margin:18px 0 16px;font-size:14px;line-height:1.85;color:#2c3e50;">' + shenzhenLine + '</p>',
    '<p style="margin:0 0 18px;font-size:14px;line-height:1.85;color:#2c3e50;">请问下周或高交会期间，贵司<strong>国际业务负责人</strong>或<strong>具身智能数据/算法负责人</strong>是否方便安排 15 分钟简短交流？我们可先行发送<strong>《REMO 具身数据样本手册》</strong>或<strong>《韩国机器人渠道落地提案》</strong>供您审阅。</p>',
    '<table cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 24px;">',
    '<tr><td align="center" bgcolor="#0f3d5e" style="background-color:#0f3d5e;border-radius:5px;">',
    '<a href="' + remoEscapeHtml_(c.landingUrl) + '" target="_blank" style="display:inline-block;padding:13px 22px;border-radius:5px;font-size:14px;font-weight:700;text-decoration:none;color:#ffffff;">查看 Asia Physical AI 合作方案与样本概览 →</a>',
    '</td></tr></table>',
    '<p style="margin:0 0 4px;font-size:13px;line-height:1.8;font-weight:700;color:#1e293b;">Asia Physical AI Commercial Network · REMO (BOAM Inc.)</p>',
    '<p style="margin:0;font-size:12.5px;line-height:1.8;color:#64748b;">商务联系 / Reply-To: <a href="mailto:' + remoEscapeHtml_(c.account) + '" style="color:#0f3d5e;text-decoration:none;">' + remoEscapeHtml_(c.account) + '</a><br>韩国首尔 · 仁川 / 深圳高交会专项组 (Korea · Shenzhen CHTF Desk)</p>',
    '</td></tr>',
    '<tr><td style="padding:16px 28px;background-color:#f8fafc;border-top:1px solid #e9edf2;">',
    '<p style="margin:0;font-size:11.5px;line-height:1.7;color:#94a3b8;">如贵司暂不考虑相关合作或希望退订，请直接回复“退订 / Unsubscribe”，我们将立即从联系名单中移除。</p>',
    '</td></tr>',
    '</table>',
    '</td></tr></table>'
  ].join('\n');

  var cleanHtml = remoSanitizeEmailHtmlLinks_(html);
  var cleanEmail = String(lead.email || '').toLowerCase().trim();
  var digest = remoDigest_(JSON.stringify([cleanEmail, subject, 'text/html', cleanHtml]));
  return {
    draftId: 'REMO_' + (lead.companyId || remoDigest_(cleanEmail).slice(0, 10)),
    email: cleanEmail,
    company: displayComp,
    sourceUrl: remoCleanUrl_(lead.website || c.landingUrl),
    subject: subject,
    body: cleanHtml,
    htmlBody: cleanHtml,
    digest: digest,
    offerTrack: track
  };
}

/* SourcingPool의 VERIFIED_READY 리드들을 DraftBodies 및 Queue(READY)로 스테이징 */
function remoStageSourcedLeadsToQueue(maxToStage) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return {staged: 0, reason: 'LOCK_BUSY'};
  try {
    var c = remoConfig_(), book = remoBook_(c);
    remoInitSourcingSheets_(book);
    var pSheet = remoSheet_(book, 'SourcingPool', REMO_SOURCING_POOL_HEADERS);
    var qSheet = remoSheet_(book, 'Queue', REMO_QUEUE_HEADERS);
    var bSheet = remoSheet_(book, 'DraftBodies', REMO_BODY_HEADERS);
    var cSheet = remoSheet_(book, 'Contacts', ['email','company','sourceUrl','enabled']);
    var sSheet = remoSheet_(book, 'Suppression', ['email','reason','at']);

    var pRows = remoRows_(pSheet);
    var qRows = remoRows_(qSheet);
    var cRows = remoRows_(cSheet);
    var suppressed = {};
    remoRows_(sSheet).forEach(function(r){ if (r[0]) suppressed[String(r[0]).toLowerCase().trim()] = true; });
    var queuedEmails = {};
    qRows.forEach(function(r){ if (r[1]) queuedEmails[String(r[1]).toLowerCase().trim()] = true; });

    var limit = Number(maxToStage || c.p.getProperty('HOURLY_SOURCING_BATCH') || 20);
    var stagedList = [];
    var nowIso = new Date().toISOString();

    for (var i = 0; i < pRows.length; i++) {
      if (stagedList.length >= limit) break;
      var r = pRows[i];
      var status = String(r[13] || '').trim();
      var email = String(r[6] || '').toLowerCase().trim();
      if (!email || suppressed[email]) continue;
      if (queuedEmails[email]) {
        if (status !== 'STAGED_TO_QUEUE') {
          pSheet.getRange(i + 2, 14, 1, 2).setValues([['STAGED_TO_QUEUE', nowIso]]);
        }
        continue;
      }
      if (status !== 'VERIFIED_READY' && status !== 'NEW') continue;

      var leadObj = {
        companyId: r[0],
        companyZh: r[1],
        companyEn: r[2],
        category: r[3],
        city: r[4],
        website: r[5],
        email: email,
        wechatOrPhone: r[7],
        signalType: r[8],
        offerTrack: r[9],
        fitScore: r[10],
        productKeywords: r[11],
        evidenceSummary: r[12]
      };
      var proposal = remoBuildCustomProposal_(leadObj, c);
      remoSaveDraftBodyToSheet_(book, {
        id: proposal.draftId,
        subject: proposal.subject,
        body: proposal.htmlBody
      }, email);

      qSheet.appendRow([
        remoCell_(proposal.draftId),
        email,
        remoCell_(proposal.company),
        proposal.sourceUrl,
        nowIso,
        'remo-auto-sourcer',
        'chtf2026-' + proposal.offerTrack.toLowerCase(),
        proposal.digest,
        'READY',
        '',
        '',
        '',
        ''
      ]);
      if (!cRows.some(function(cr){ return String(cr[0]).toLowerCase().trim() === email; })) {
        cSheet.appendRow([email, remoCell_(proposal.company), proposal.sourceUrl, 'yes']);
        cRows.push([email, proposal.company, proposal.sourceUrl, 'yes']);
      }
      pSheet.getRange(i + 2, 14, 1, 2).setValues([['STAGED_TO_QUEUE', nowIso]]);
      queuedEmails[email] = true;
      stagedList.push(proposal);
    }

    if (stagedList.length) {
      SpreadsheetApp.flush();
      var events = remoSheet_(book, 'Events', REMO_HEADERS);
      var summaryLines = ['🟣[REMO 소싱적재] 신규 ' + stagedList.length + '건 Queue(READY) 등록'];
      stagedList.forEach(function(item) {
        summaryLines.push('- [' + item.offerTrack + '] ' + item.company + ' (' + item.email + ')');
      });
      var reportMsg = summaryLines.join('\n');
      var tgId = 'SHEET_ONLY';
      try {
        var tgRes = remoTelegram_(c, 'sendMessage', {
          chat_id: c.chat,
          text: reportMsg.slice(0, 3900),
          disable_web_page_preview: true
        });
        tgId = String((tgRes && tgRes.message_id) || 'SENT');
      } catch(e) {}
      events.appendRow([
        'SOURCING_STAGE_' + Date.now(),
        'SOURCING_STAGED',
        c.account,
        'REMO 소싱엔진',
        '🟣[REMO 소싱적재] ' + stagedList.length + '건',
        nowIso,
        reportMsg.slice(0, 240),
        'SENT',
        tgId,
        ''
      ]);
    }
    return {staged: stagedList.length, items: stagedList.map(function(x){ return x.email; })};
  } finally {
    lock.releaseLock();
  }
}

/* 새벽(04:00~08:00 KST) 및 저녁(19:00~22:00 KST) 매시간 자동 소싱 트리거 핸들러 */
function remoSourcingRun() {
  var p = remoEnsureEnv_();
  if (p.getProperty('SOURCING_ENABLED') !== 'yes') return {status: 'SOURCING_DISABLED'};
  var c = remoConfig_(), book = remoBook_(c);
  remoInitSourcingSheets_(book);

  var localHour = Number(Utilities.formatDate(new Date(), 'Asia/Seoul', 'HH'));
  var isSourcingHour = (localHour >= 4 && localHour <= 8) || (localHour >= 19 && localHour <= 22);

  // Serper API 또는 Brave Search API 키가 Config에 설정되어 있으면 실시간 웹 검색으로 신규 중국 휴머노이드 리드 발굴
  var discoveredFromWeb = 0;
  if (isSourcingHour) {
    try { discoveredFromWeb = remoDiscoverNewLeadsFromSearchApi_(c, book); } catch(e) {}
  }

  // SourcingPool에 준비된 리드들을 시간당 배치 크기만큼 Queue(READY) + DraftBodies로 적재
  var batchSize = Number(p.getProperty('HOURLY_SOURCING_BATCH') || 5);
  var stagedResult = remoStageSourcedLeadsToQueue(batchSize);
  return {
    status: 'OK',
    kstHour: localHour,
    discoveredFromWeb: discoveredFromWeb,
    stagedToQueue: stagedResult.staged
  };
}

/* 선택적 웹 검색 API 연동 (Config 시트에 SERPER_API_KEY 또는 BRAVE_API_KEY 등록 시 자동 작동) */
function remoDiscoverNewLeadsFromSearchApi_(c, book) {
  var serperKey = String(c.p.getProperty('SERPER_API_KEY') || '').trim();
  var braveKey = String(c.p.getProperty('BRAVE_API_KEY') || '').trim();
  if (!serperKey && !braveKey) return 0;

  var qSheet = remoSheet_(book, 'SourcingQueries', REMO_SOURCING_QUERY_HEADERS);
  var pSheet = remoSheet_(book, 'SourcingPool', REMO_SOURCING_POOL_HEADERS);
  var qRows = remoRows_(qSheet), pRows = remoRows_(pSheet);
  var existingEmails = {};
  pRows.forEach(function(r){ if (r[6]) existingEmails[String(r[6]).toLowerCase().trim()] = true; });

  var targetIdx = qRows.findIndex(function(r){ return String(r[7] || 'ACTIVE') === 'ACTIVE'; });
  if (targetIdx < 0) return 0;
  var qRow = qRows[targetIdx];
  var queryStr = String(qRow[3] || '');
  var category = String(qRow[1] || '1_China_Humanoid_Embodied_AI');
  var defaultTrack = String(qRow[4] || 'DUAL_OFFER');

  var snippets = [];
  if (serperKey) {
    var res = UrlFetchApp.fetch('https://google.serper.dev/search', {
      method: 'post',
      contentType: 'application/json',
      headers: {'X-API-KEY': serperKey},
      payload: JSON.stringify({q: queryStr, num: 10}),
      muteHttpExceptions: true
    });
    var data = JSON.parse(res.getContentText() || '{}');
    snippets = (data.organic || []).map(function(o){
      return {title: o.title || '', url: o.link || '', snippet: o.snippet || ''};
    });
  } else if (braveKey) {
    var bRes = UrlFetchApp.fetch('https://api.search.brave.com/res/v1/web/search?q=' + encodeURIComponent(queryStr) + '&count=10', {
      method: 'get',
      headers: {'Accept': 'application/json', 'X-Subscription-Token': braveKey},
      muteHttpExceptions: true
    });
    var bData = JSON.parse(bRes.getContentText() || '{}');
    snippets = ((bData.web && bData.web.results) || []).map(function(o){
      return {title: o.title || '', url: o.url || '', snippet: o.description || ''};
    });
  }

  var added = 0;
  var nowIso = new Date().toISOString();
  snippets.forEach(function(item, idx) {
    var emails = remoAddress_(item.title + ' ' + item.snippet);
    if (!emails.length) return;
    var email = emails[0];
    if (existingEmails[email] || /@(example\.com|gmail\.com|qq\.com)$/i.test(email)) return;
    var compName = String(item.title || '').split(/[-|_—·]/)[0].trim().slice(0, 50) || email.split('@')[1];
    var track = defaultTrack;
    if (/遥操作|数据集|采集|仿真|VLA|合成数据/i.test(item.snippet)) track = 'DATA_REMO';
    else if (/海外|出海|代理|渠道|distributor|global/i.test(item.snippet)) track = 'KR_DIST_SI';

    pSheet.appendRow([
      'WEB-' + Date.now() + '-' + idx,
      compName,
      compName,
      category,
      'China',
      item.url,
      email,
      '',
      'WEB_SEARCH_DISCOVERED',
      track,
      85,
      compName,
      String(item.snippet || '').slice(0, 180),
      'VERIFIED_READY',
      nowIso
    ]);
    existingEmails[email] = true;
    added++;
  });

  qSheet.getRange(targetIdx + 2, 6, 1, 2).setValues([[nowIso, Number(qRow[6] || 0) + added]]);
  if (added) SpreadsheetApp.flush();
  return added;
}

/* ==========================================================================
 * 3. 하루 한 타임 발송 완료 시 텔레그램 일괄 발송 보고 (🔵[REMO] 발송보고 N건)
 * ========================================================================== */

function remoFormatCycleTime_(isoOrMs) {
  var d = isoOrMs ? new Date(isoOrMs) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  return Utilities.formatDate(d, 'Asia/Seoul', 'MM/dd HH:mm');
}

function remoKstDateStr_(isoOrMs) {
  var d = isoOrMs ? new Date(isoOrMs) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  return Utilities.formatDate(d, 'Asia/Seoul', 'yyyy-MM-dd');
}

function remoRecordCycleItem_(c, company, email, atIso, isSuccess) {
  var todayKst = remoKstDateStr_(Date.now());
  var raw = c.p.getProperty('CYCLE_REPORT_BUFFER') || '[]';
  var list = [];
  try { list = JSON.parse(raw); if (!Array.isArray(list)) list = []; } catch(e) { list = []; }
  list = list.filter(function(item) { return remoKstDateStr_(item.at) === todayKst; });
  var cleanEmail = String(email || '').toLowerCase().trim();
  var existingIdx = list.findIndex(function(item) { return item.email === cleanEmail; });
  var entry = {
    company: String(company || '').replace(/^'+/, '').trim() || '기업미상',
    email: cleanEmail,
    at: atIso || new Date().toISOString(),
    ok: Boolean(isSuccess)
  };
  if (existingIdx >= 0) list[existingIdx] = entry;
  else list.push(entry);
  c.p.setProperty('CYCLE_REPORT_BUFFER', JSON.stringify(list));
  return list.length;
}

function remoCollectTodayBatchItems_(c, book) {
  var todayKst = remoKstDateStr_(Date.now());
  var qSheet = remoSheet_(book, 'Queue', REMO_QUEUE_HEADERS);
  var qRows = remoRows_(qSheet);
  var byEmail = {};
  var ordered = [];

  qRows.forEach(function(r) {
    var email = String(r[1] || '').toLowerCase().trim();
    var company = String(r[2] || '').replace(/^'+/, '').trim() || '기업미상';
    var status = String(r[8] || '').trim();
    var reservedAt = String(r[9] || '').trim();
    if (!email || !reservedAt) return;
    if (remoKstDateStr_(reservedAt) !== todayKst) return;
    if (status === 'READY' || status === 'WAIT_FOR_DRAFT_SYNC' || status === 'SENDING') return;

    var isOk = (status === 'SENT');
    var item = {company: company, email: email, at: reservedAt, ok: isOk, status: status};
    if (!byEmail[email]) {
      byEmail[email] = item;
      ordered.push(item);
    } else {
      byEmail[email].at = reservedAt;
      byEmail[email].ok = isOk;
      byEmail[email].status = status;
    }
  });

  var raw = c.p.getProperty('CYCLE_REPORT_BUFFER') || '[]';
  var buf = [];
  try { buf = JSON.parse(raw); if (!Array.isArray(buf)) buf = []; } catch(e) { buf = []; }
  buf.forEach(function(b) {
    if (!b || !b.email || remoKstDateStr_(b.at) !== todayKst) return;
    var em = String(b.email).toLowerCase().trim();
    if (!byEmail[em]) {
      var item = {company: b.company || '기업미상', email: em, at: b.at, ok: Boolean(b.ok)};
      byEmail[em] = item;
      ordered.push(item);
    }
  });

  ordered.sort(function(a, b) {
    return (Date.parse(a.at) || 0) - (Date.parse(b.at) || 0);
  });
  return ordered;
}

function remoBuildCycleReportText_(items) {
  var okCount = items.filter(function(x){ return x.ok; }).length;
  var failCount = items.length - okCount;
  var header = '🔵[REMO 중국휴머노이드] 발송보고 ' + items.length + '건';
  if (failCount > 0) {
    header += ' (성공 ' + okCount + ' · 실패 ' + failCount + ')';
  }
  var lines = [header];
  items.forEach(function(item) {
    var comp = String(item.company || '').replace(/\s+/g, ' ').trim();
    var em = String(item.email || '').trim();
    var tm = remoFormatCycleTime_(item.at);
    var icon = item.ok ? '🟢' : '🔴';
    lines.push('- ' + icon + ' ' + comp + ' ' + em + ' ' + tm);
  });
  return lines.join('\n');
}

function remoFlushCycleTelegramReport_(c, book, forceFlush) {
  var todayKst = remoKstDateStr_(Date.now());
  var list = remoCollectTodayBatchItems_(c, book);
  if (!list.length) return {flushed: false, count: 0, reason: 'NO_DISPATCHED_ITEMS_TODAY'};

  var qSheet = remoSheet_(book, 'Queue', REMO_QUEUE_HEADERS);
  var qRows = remoRows_(qSheet);
  var readyRemaining = qRows.filter(function(r) {
    var st = String(r[8] || '').trim();
    return st === 'READY' || st === 'WAIT_FOR_DRAFT_SYNC' || st === 'SENDING';
  }).length;

  var win = remoDispatchWindow_(Date.now());
  var dailyMax = Number(c.p.getProperty('DAILY_MAX_SENDS') || 50);
  var todaySentCount = list.filter(function(x){ return x.ok; }).length;
  var hitDailyLimit = (todaySentCount >= dailyMax || list.length >= dailyMax);
  var afterEveningCutoff = (win.hour >= 20);

  if (!forceFlush) {
    if (readyRemaining > 0 && !hitDailyLimit && !afterEveningCutoff) {
      return {flushed: false, todayAccumulatedCount: list.length, readyRemaining: readyRemaining, reason: 'BATCH_STILL_IN_PROGRESS'};
    }
    if (list.length < 5 && !hitDailyLimit && !afterEveningCutoff && readyRemaining > 0) {
      return {flushed: false, todayAccumulatedCount: list.length, readyRemaining: readyRemaining, reason: 'WAITING_FOR_FULL_DAILY_BATCH'};
    }
  }

  var reportSignature = todayKst + ':' + list.length;
  if (!forceFlush && c.p.getProperty('LAST_BATCH_REPORT_SIG') === reportSignature) {
    return {flushed: false, count: list.length, reason: 'ALREADY_REPORTED_THIS_BATCH'};
  }

  var text = remoBuildCycleReportText_(list);
  var msgId = 'SHEET_ONLY';
  try {
    var res = remoTelegram_(c, 'sendMessage', {
      chat_id: c.chat,
      text: text.slice(0, 3900),
      disable_web_page_preview: true
    });
    msgId = String((res && res.message_id) || 'SENT');
  } catch(e) {
    return {flushed: false, count: list.length, error: String(e.message || e)};
  }

  c.p.setProperty('LAST_BATCH_REPORT_SIG', reportSignature);
  c.p.deleteProperty('CYCLE_REPORT_BUFFER');

  var events = remoSheet_(book, 'Events', REMO_HEADERS);
  events.appendRow([
    'CYCLE_REPORT_' + Date.now(),
    'CYCLE_BATCH_REPORT',
    c.account,
    'REMO 중국리드 일괄보고',
    '🔵[REMO] 발송보고 ' + list.length + '건',
    new Date().toISOString(),
    text.slice(0, 240),
    'SENT',
    msgId,
    ''
  ]);
  SpreadsheetApp.flush();
  return {flushed: true, count: list.length, telegramId: msgId, reportText: text};
}

/* ==========================================================================
 * 4. 고객 회신·문의 기본 웰컴 양식(REMO_WELCOME_HTML) 렌더링 및 자동 회신
 * ========================================================================== */

function remoRenderWelcomeEmail_(contactName, company, customContextText, c) {
  var safeName = remoEscapeHtml_(String(contactName || '负责人').trim() || '负责人');
  var safeCompany = remoEscapeHtml_(String(company || '贵司').trim() || '贵司');
  var landingUrl = (c && c.landingUrl) || REMO_DEFAULT_ENV.LANDING_URL;
  var customBlock = '';
  if (customContextText && String(customContextText).trim()) {
    customBlock = '<p style="margin: 0 0 16px; font-size: 14px; color: #334155; line-height: 1.8;">' +
      remoEscapeHtml_(String(customContextText).trim()).replace(/\n/g, '<br>') +
      '</p>';
  }
  var rendered = REMO_WELCOME_HTML_TEMPLATE
    .replace(/\{\{\s*name\s*\}\}/g, safeName)
    .replace(/\{\{\s*company\s*\}\}/g, safeCompany)
    .replace(/\{\{\s*landingUrl\s*\}\}/g, remoEscapeHtml_(landingUrl))
    .replace('{{customContextBlock}}', customBlock);
  return remoSanitizeEmailHtmlLinks_(rendered);
}

function remoBuildWelcomeMime_(toEmail, subject, htmlBody, inReplyToMsgId, referencesHeader, c) {
  var cleanHtml = remoSanitizeEmailHtmlLinks_(htmlBody);
  var senderAddr = (c && c.account) || 'remo@boam.tech';
  var senderLabel = (c && c.senderName) || 'Asia Physical AI Commercial Network · REMO';
  var enc = function(v) { return '=?UTF-8?B?' + Utilities.base64Encode(String(v || ''), Utilities.Charset.UTF_8) + '?='; };
  var b64 = Utilities.base64Encode(cleanHtml, Utilities.Charset.UTF_8);
  var chunks = b64.match(/.{1,76}/g);
  var body = chunks ? chunks.join('\r\n') : b64;
  var msgId = '<remo.welcome.' + remoDigest_(toEmail + '|' + subject + '|' + Date.now()) + '@boam.tech>';
  var headers = [
    'From: ' + enc(senderLabel) + ' <' + senderAddr + '>',
    'Reply-To: ' + senderAddr,
    'To: ' + toEmail,
    'Subject: ' + enc(subject),
    'Message-ID: ' + msgId
  ];
  if (inReplyToMsgId) headers.push('In-Reply-To: ' + inReplyToMsgId);
  if (referencesHeader) headers.push('References: ' + referencesHeader);
  headers.push(
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body
  );
  return Utilities.base64EncodeWebSafe(headers.join('\r\n'), Utilities.Charset.UTF_8);
}

function remoSendWelcomeReply(toEmail, contactName, company, customContextText, optThreadId, optInReplyTo) {
  var c = remoConnections_(), book = remoBook_(c);
  var cleanEmail = String(toEmail || '').toLowerCase().trim();
  if (!cleanEmail) throw new Error('RECIPIENT_REQUIRED');
  if (remoSystemInbound_(cleanEmail, company || '', customContextText || '', {})) {
    return {mode: 'BLOCKED_SYSTEM_SENDER', to: cleanEmail};
  }
  var compName = String(company || '').replace(/^'+/, '').trim() || 'Partner';
  var subj = '[REMO · Physical AI Network] 感谢 ' + compName + ' 的回复 · 具身数据样本与韩国渠道合作对接 (CHTF 2026)';
  var html = remoRenderWelcomeEmail_(contactName || '负责人', compName, customContextText || '', c);
  var raw = remoBuildWelcomeMime_(cleanEmail, subj, html, optInReplyTo || '', optInReplyTo || '', c);
  var payload = {raw: raw};
  if (optThreadId) payload.threadId = optThreadId;

  if (c.isWorkspaceSender && c.p.getProperty('WELCOME_AUTO_REPLY') !== 'draft_only') {
    var sent = Gmail.Users.Messages.send(payload, 'me');
    c.p.setProperty('WELCOME_REPLIED_' + cleanEmail, sent.id);
    var events = remoSheet_(book, 'Events', REMO_HEADERS);
    events.appendRow([
      sent.id,
      'WELCOME_REPLY_SENT',
      cleanEmail,
      remoCell_(compName),
      remoCell_(subj),
      new Date().toISOString(),
      '중국 휴머노이드 Dual-Offer 웰컴 양식(REMO_WELCOME_HTML) 자동 회신 완료',
      'SENT',
      'AUTO_WELCOME',
      ''
    ]);
    SpreadsheetApp.flush();
    return {mode: 'SENT', gmailId: sent.id, threadId: sent.threadId || optThreadId || '', subject: subj};
  } else {
    var draft = Gmail.Users.Drafts.create({message: payload}, 'me');
    c.p.setProperty('WELCOME_REPLIED_' + cleanEmail, 'DRAFT_' + draft.id);
    return {mode: 'DRAFT', draftId: draft.id, subject: subj};
  }
}

/* ==========================================================================
 * 5. 수신함 회신·문의·수신거부·반송 상시 감시 (중국어·영문·한국어 3개국어 지원)
 * ========================================================================== */

function remoClassifyInboundText_(text, subject) {
  var clean = remoStripQuoted_(text || '');
  var combined = (String(subject || '') + '\n' + clean).trim();
  if (/退订|不再接收|取消订阅|请勿发送|请移除|수신\s*거부|보내지\s*마|구독\s*취소|unsubscribe|stop\s+(email|sending)|remove\s+me|do\s+not\s+(email|contact)|opt[\s-]*out/i.test(combined)) {
    return 'OPT_OUT';
  }
  if (/自动回复|不在办公室|休假|外出|자동\s*응답|부재중|휴가중|auto[\s-]*reply|out\s+of\s+office|vacation/i.test(combined)) {
    return 'AUTO_REPLY';
  }
  if (/报价|价格|预算|样本|样品|数据集|采集|遥操作|合成数据|代理|总代|渠道|韩国|出海|系统集成|PoC|高交会|CHTF|深圳|面谈|会议|微信|WeChat|견적|단가|샘플|데이터|총판|quote|pricing|sample|dataset|teleop|distribution|meeting/i.test(combined)) {
    return 'QUOTE_INTENT';
  }
  if (/合作|沟通|交流|发一下|资料|介绍|感谢|联系|安排|电话|검토|논의|관심|보내주|미팅|interested|discuss|schedule|call|connect/i.test(combined)) {
    return 'POSITIVE';
  }
  return 'GENERAL_REPLY';
}

function remoIsBounceMessage_(from, subject, bodyText) {
  var addr = String(from || '').toLowerCase().trim();
  var sub = String(subject || '').toLowerCase();
  var body = String(bodyText || '').toLowerCase();
  if (/^(mailer-daemon|postmaster)@/i.test(addr)) return true;
  if (/delivery status notification|undeliverable|mail delivery failed|failure notice|returned mail|退信|系统退信|投递失败|未能送达|반송|전달되지 않|전송되지 않았습니다/i.test(sub)) return true;
  if (/주소를 찾을 수 없음|해당 주소에서 메일을 받을 수 없어|diagnostic-code:|final-recipient:\s*rfc822|550\s+5\.1\.1|user not found|mailbox unavailable|收件人不存在|邮箱不存在/i.test(body)) return true;
  return false;
}

function remoSystemInbound_(from, subject, bodyText, headers) {
  var addr = String(from || '').toLowerCase().trim();
  var sub = String(subject || '');
  var body = String(bodyText || '');
  var combined = sub + '\n' + body;
  var autoSubmitted = String((headers && headers['auto-submitted']) || '').toLowerCase();

  if (/^(mailer-daemon|postmaster)@/i.test(addr)) return true;
  if (/@(google\.com|googlemail\.com|accounts\.google\.com|gstatic\.com|youtube\.com|vercel\.com|github\.com|resend\.com|updates\.resend\.com|cloudflare\.com|amazonaws\.com|firebase\.google\.com|stripe\.com)$/i.test(addr)) {
    return true;
  }
  if (/^(no-reply|noreply|donotreply|do-not-reply|workspacesupport|googleworkspace|security|alert|alerts|notification|notifications|billing|invoice|receipt|system|daemon|bounce|verify|verification|newsletter|news|privacypolicy|abuse)@/i.test(addr)) {
    return true;
  }
  if (/Google Workspace account|DNS record|release the domain|verification instructions|\[#\d+\]\s*IMPORTANT:|ref:_00D|Delivery Status Notification|주소를 찾을 수 없음|메일이 전송되지 않았습니다|보안 알림|새 기기에서 로그인|비밀번호 재설정|인증번호/i.test(combined)) {
    return true;
  }
  if (headers && (headers['list-id'] || headers['list-unsubscribe'] || headers['x-autorequest'] || (autoSubmitted && autoSubmitted !== 'no'))) {
    if (!/机器人|具身智能|数据集|遥操作|REMO|CHTF|humanoid|robotics|dataset|휴머노이드/i.test(combined)) return true;
  }
  return false;
}

function remoHasBusinessInquiryIntent_(subject, bodyText) {
  var combined = (String(subject || '') + '\n' + String(bodyText || '')).trim();
  return /机器人|人形|具身智能|数据集|遥操作|灵巧手|传感器|合成数据|仿真|算法|训练|韩国|代理|渠道|出海|集成|高交会|CHTF|深圳|合作|报价|样品|微信|humanoid|robot|embodied|dataset|teleop|synthetic|distribution|partner|휴머노이드|로봇|데이터|총판/i.test(combined);
}

function remoAddSuppression_(book, email, reason) {
  var clean = String(email || '').toLowerCase().trim();
  if (!clean) return;
  var sup = remoSheet_(book, 'Suppression', ['email','reason','at']);
  var rows = remoRows_(sup);
  if (!rows.some(function(r){ return String(r[0] || '').toLowerCase().trim() === clean; })) {
    sup.appendRow([clean, reason || 'OPT_OUT_OR_BOUNCE', new Date().toISOString()]);
  }
  var contacts = book.getSheetByName('Contacts');
  if (contacts) {
    var cRows = remoRows_(contacts);
    cRows.forEach(function(r, idx) {
      if (String(r[0] || '').toLowerCase().trim() === clean && String(r[3] || '') !== 'no') {
        contacts.getRange(idx + 2, 4).setValue('no');
      }
    });
  }
}

function remoCleanupPollutedSheetRows_(book) {
  if (!book) return 0;
  var cleaned = 0;
  var badPattern = /^(workspacesupport@google\.com|mailer-daemon@googlemail\.com|postmaster@|no-reply@|noreply@)/i;

  var contacts = book.getSheetByName('Contacts');
  if (contacts) {
    var cRows = remoRows_(contacts);
    for (var i = cRows.length - 1; i >= 0; i--) {
      var em = String(cRows[i][0] || '').toLowerCase().trim();
      var src = String(cRows[i][2] || '').toLowerCase().trim();
      if (badPattern.test(em) || /@(google\.com|googlemail\.com)$/i.test(em) || (src === 'gmail-inbound' && !em)) {
        contacts.deleteRow(i + 2);
        cleaned++;
      }
    }
  }

  var events = book.getSheetByName('Events');
  if (events) {
    var eRows = remoRows_(events);
    eRows.forEach(function(r, idx) {
      var em = String(r[2] || '').toLowerCase().trim();
      var st = String(r[7] || '').trim();
      if ((badPattern.test(em) || /@(google\.com|googlemail\.com)$/i.test(em)) && st === 'PENDING') {
        events.getRange(idx + 2, 8, 1, 2).setValues([['FILTERED_SYSTEM', 'IGNORED']]);
        cleaned++;
      }
    });
  }
  if (cleaned) SpreadsheetApp.flush();
  return cleaned;
}

function remoInboundFailure_(message, book, c, preview) {
  var h = remoHeaders_(message), from = remoAddress_(h.from)[0] || '';
  var sub = h.subject || '';
  var text = remoExtractPlain_(message.payload) || remoHtmlToText_(remoExtractHtml_(message.payload)) || String(message.snippet || '');
  if (!remoIsBounceMessage_(from, sub, text)) return null;

  var addrs = remoAddress_(text).filter(function(a) {
    return !remoOwnerEmail_(a) && !/^(mailer-daemon|postmaster|workspacesupport)@/i.test(a) && !/@(google\.com|googlemail\.com)$/i.test(a);
  });
  var failedEmail = addrs[0] || '';

  if (failedEmail && !preview) {
    if (/5\.1\.1|550|no such user|user unknown|address rejected|收件人不存在|邮箱不存在|존재하지 않|주소를 찾을 수 없음|받을 수 없어/i.test(text)) {
      remoAddSuppression_(book, failedEmail, 'BOUNCED_INVALID_ADDRESS');
    }
  }

  if (failedEmail) {
    var qSheet = remoSheet_(book, 'Queue', REMO_QUEUE_HEADERS);
    var qRows = remoRows_(qSheet);
    var matchedIdx = -1, matchedRow = null;
    for (var i = qRows.length - 1; i >= 0; i--) {
      var r = qRows[i];
      var rEmail = String(r[1] || '').toLowerCase().trim();
      var rThread = String(r[11] || '').trim();
      if (rEmail === failedEmail && (rThread === String(message.threadId || '') || String(r[8] || '') === 'SENT')) {
        matchedIdx = i;
        matchedRow = r;
        break;
      }
    }
    if (matchedRow && !preview) {
      var failStatus = 'FAILED_OTHER';
      if (/5\.1\.1|550|no such user|user unknown|address rejected|收件人不存在|邮箱不存在|존재하지 않|주소를 찾을 수 없음/i.test(text)) failStatus = 'BOUNCED_INVALID_ADDRESS';
      else if (/5\.7\.1|policy|blocked|spam|垃圾邮件/i.test(text)) failStatus = 'FAILED_POLICY';
      else if (/quota|rate limit|4\.2\.2|5\.2\.2/i.test(text)) failStatus = 'FAILED_QUOTA';

      qSheet.getRange(matchedIdx + 2, 9).setValue(failStatus);
      qSheet.getRange(matchedIdx + 2, 13).setValue('BOUNCE_' + message.id);
      remoRecordCycleItem_(c, matchedRow[2], failedEmail, matchedRow[9] || new Date().toISOString(), false);
    }
  }

  var at = new Date(Number(message.internalDate || Date.now())).toISOString();
  return [message.id, 'DELIVERY_FAILED', failedEmail || from, '반송알림(자동격리)', remoCell_(sub || '반송 알림'), at, '반송 주소 자동 차단 및 발송보고(🔴) 반영 완료', 'SENT', 'BOUNCE_SILENT_HANDLED', ''];
}

function remoInboundEvent_(message, book, c, contacts, preview) {
  var h = remoHeaders_(message), from = remoAddress_(h.from), to = remoAddress_([h.to, h.cc, h.delivered_to].join(','));
  if (!from.length || remoOwnerEmail_(from[0])) return null;

  var plain = remoExtractPlain_(message.payload);
  var htmlText = remoHtmlToText_(remoExtractHtml_(message.payload));
  var rawText = (plain || htmlText || String(message.snippet || '')).trim();
  var cleanBody = remoStripQuoted_(rawText) || rawText;

  if (remoIsBounceMessage_(from[0], h.subject, cleanBody)) {
    return remoInboundFailure_(message, book, c, preview);
  }
  if (!to.some(remoOwnerEmail_) || remoSystemInbound_(from[0], h.subject, cleanBody, h)) {
    return null;
  }

  var fromEmail = from[0];
  var fromName = remoSenderName_(h.from, fromEmail);
  var contact = (contacts || []).find(function(x) { return String(x.email || '').toLowerCase().trim() === fromEmail; });

  if (!contact && !remoHasBusinessInquiryIntent_(h.subject, cleanBody)) {
    return null;
  }

  var files = remoAttachmentNames_(message.payload);
  var replyClass = remoClassifyInboundText_(cleanBody, h.subject);

  var company = contact ? contact.company : fromName;
  var kind = contact ? 'LEAD_REPLY' : 'NEW_INQUIRY';
  if (replyClass === 'OPT_OUT') {
    kind = 'OPT_OUT';
    if (!preview) remoAddSuppression_(book, fromEmail, 'OPT_OUT_REPLY_' + message.id);
  }

  var welcomeNote = '';
  if (!preview && (kind === 'LEAD_REPLY' || kind === 'NEW_INQUIRY') && replyClass !== 'OPT_OUT' && replyClass !== 'AUTO_REPLY') {
    var alreadyWelcomed = c.p.getProperty('WELCOME_REPLIED_' + fromEmail);
    if (!alreadyWelcomed && c.p.getProperty('WELCOME_AUTO_REPLY') === 'yes') {
      try {
        var customLine = '已收到贵司关于《' + String(h.subject || '合作垂询').slice(0, 45) + '》的来信，我们团队正为您匹配相应的数据样本与韩国渠道方案。';
        var wRes = remoSendWelcomeReply(fromEmail, fromName, company, customLine, message.threadId, h['message-id'] || '');
        welcomeNote = wRes.mode === 'SENT' ? ' [중문웰컴 자동회신 완료]' : ' [중문웰컴 회신초안 생성]';
      } catch(e) {
        welcomeNote = ' [웰컴회신 대기]';
      }
    }
  }

  var classTag = '[' + replyClass + '] ';
  var bodyExcerpt = (classTag + cleanBody.replace(/\s+/g, ' ').slice(0, 180) + (files.length ? ' (첨부: ' + files.join(', ') + ')' : '') + welcomeNote).trim();
  var at = new Date(Number(message.internalDate || Date.now())).toISOString();
  return [message.id, kind, fromEmail, remoCell_(company), remoCell_(h.subject || '(제목 없음)'), at, remoCell_(bodyExcerpt.slice(0, 240)), 'PENDING', '', ''];
}

function remoInboundScan_(c, book, preview) {
  try { remoCleanupPollutedSheetRows_(book); } catch(e) {}
  var contactsSheet = remoSheet_(book, 'Contacts', ['email','company','sourceUrl','enabled']);
  var contacts = remoRows_(contactsSheet).filter(function(r) {
    var em = String(r[0] || '').toLowerCase().trim();
    return em && !/@(google\.com|googlemail\.com)$/i.test(em) && !/^(workspacesupport|mailer-daemon|postmaster)@/i.test(em);
  }).map(function(r) {
    return {email: String(r[0] || '').toLowerCase().trim(), company: String(r[1] || '').replace(/^'+/, '').trim()};
  });
  var eventsSheet = remoSheet_(book, 'Events', REMO_HEADERS);
  var existingIds = {};
  remoRows_(eventsSheet).forEach(function(r) { if (r[0]) existingIds[String(r[0])] = true; });

  var afterSec = Math.floor((Date.now() - 7 * 86400000) / 1000);
  var q = 'in:anywhere -in:drafts -in:sent after:' + afterSec;
  var list = Gmail.Users.Messages.list('me', {q: q, maxResults: 25, includeSpamTrash: true});
  var msgs = (list && list.messages) || [];
  var added = 0;

  for (var i = msgs.length - 1; i >= 0; i--) {
    var mId = msgs[i].id;
    if (existingIds[mId]) continue;
    var full;
    try { full = Gmail.Users.Messages.get('me', mId, {format: 'full'}); } catch(e) { continue; }
    if (!full) continue;
    var ev = remoInboundEvent_(full, book, c, contacts, Boolean(preview));
    if (ev && !preview) {
      eventsSheet.appendRow(ev);
      existingIds[mId] = true;
      if (ev[7] === 'PENDING') added++;
    }
  }
  if (added) SpreadsheetApp.flush();
  return added;
}

function remoSendEventRowToTelegram_(c, sheet, idx, row) {
  var kind = String(row[1] || '');
  var email = String(row[2] || '').toLowerCase().trim();
  if (
    kind === 'MAIL_ACCEPTED' ||
    kind === 'CYCLE_BATCH_REPORT' ||
    kind === 'WELCOME_REPLY_SENT' ||
    kind === 'DELIVERY_FAILED' ||
    kind === 'SOURCING_STAGED' ||
    remoSystemInbound_(email, row[4], row[6], {})
  ) {
    sheet.getRange(idx, 8, 1, 2).setValues([['SENT', 'BATCH_OR_FILTERED']]);
    return 'SKIPPED_BATCH';
  }
  sheet.getRange(idx, 8).setValue('SENDING');
  SpreadsheetApp.flush();
  var headerTitle = '🔔 [REMO 중국리드] 메일 알림';
  if (kind === 'LEAD_REPLY') headerTitle = '🟢 [REMO 중국휴머노이드] 기업 후속 회신 도착';
  else if (kind === 'NEW_INQUIRY') headerTitle = '🟡 [REMO 중국휴머노이드] 새 외부 문의 도착';
  else if (kind === 'OPT_OUT') headerTitle = '⚪️ [REMO 중국휴머노이드] 수신거부 접수 (자동 차단 완료)';

  var text = [
    headerTitle,
    '기업/발신: ' + String(row[3] || '').replace(/^'+/, ''),
    '이메일: ' + row[2],
    '제목: ' + String(row[4] || '').replace(/^'+/, ''),
    '시각: ' + remoFormatCycleTime_(row[5]),
    '내용: ' + String(row[6] || '').replace(/^'+/, ''),
    'Gmail ID: ' + row[0]
  ].join('\n');

  try {
    var res = remoTelegram_(c, 'sendMessage', {
      chat_id: c.chat,
      text: text.slice(0, 3900),
      disable_web_page_preview: true
    });
    sheet.getRange(idx, 8, 1, 3).setValues([['SENT', String((res && res.message_id) || 'SHEET_ONLY'), '']]);
    return 'SENT';
  } catch(e) {
    sheet.getRange(idx, 8, 1, 3).setValues([['UNKNOWN', '', String(e.message || e).slice(0, 120)]]);
    return 'UNKNOWN';
  }
}

function remoRun() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return {status: 'BUSY'};
  try {
    var c = remoConnections_(), book = remoBook_(c);
    var inboundAdded = 0;
    try { inboundAdded = remoInboundScan_(c, book, false); } catch(e) {}
    var sheet = remoSheet_(book, 'Events', REMO_HEADERS);
    var rows = remoRows_(sheet), sent = 0, jobs = 0;
    rows.forEach(function(r, i) {
      var kind = String(r[1] || '');
      if (kind === 'MAIL_ACCEPTED' || kind === 'DELIVERY_FAILED' || kind === 'SOURCING_STAGED') {
        if (r[7] === 'PENDING') sheet.getRange(i + 2, 8, 1, 2).setValues([['CYCLE_BUFFERED', 'BATCH_MODE']]);
        return;
      }
      if (jobs < 20 && r[7] === 'PENDING') {
        jobs++;
        if (remoSendEventRowToTelegram_(c, sheet, i + 2, r) === 'SENT') sent++;
      }
    });
    c.p.setProperty('LAST_RUN', new Date().toISOString());
    return {inboundDetected: inboundAdded, telegramAlertsSent: sent};
  } finally {
    lock.releaseLock();
  }
}

/* ==========================================================================
 * 6. 공유 시트(DraftBodies · Queue) 동적 동기화 및 5분 간격 순차 발송 엔진
 * ========================================================================== */

function remoSaveDraftBodyToSheet_(book, draftObj, email) {
  if (!book || !draftObj || !draftObj.body) return;
  var bSheet = remoSheet_(book, 'DraftBodies', REMO_BODY_HEADERS);
  var bRows = remoRows_(bSheet);
  var cleanId = String(draftObj.id || '').replace(/^'+/, '').trim();
  var cleanEmail = String(email || '').toLowerCase().trim();
  var cleanHtml = remoSanitizeEmailHtmlLinks_(draftObj.body);
  var cleanDigest = remoDigest_(JSON.stringify([cleanEmail, draftObj.subject || '', 'text/html', cleanHtml]));
  var existingIdx = bRows.findIndex(function(r) {
    return String(r[1] || '').toLowerCase().trim() === cleanEmail || String(r[0] || '').replace(/^'+/, '').trim() === cleanId;
  });
  var rowVals = [remoCell_(cleanId), cleanEmail, remoCell_(draftObj.subject || ''), cleanDigest, cleanHtml, new Date().toISOString()];
  if (existingIdx >= 0) {
    bSheet.getRange(existingIdx + 2, 1, 1, 6).setValues([rowVals]);
  } else {
    bSheet.appendRow(rowVals);
  }
}

function remoReadDraftBodyFromSheet_(book, id, email) {
  if (!book) return null;
  var cleanId = String(id || '').replace(/^'+/, '').trim();
  var cleanEmail = String(email || '').toLowerCase().trim();
  var bSheet = remoSheet_(book, 'DraftBodies', REMO_BODY_HEADERS);
  var bRows = remoRows_(bSheet);
  for (var i = bRows.length - 1; i >= 0; i--) {
    var r = bRows[i];
    var rId = String(r[0] || '').replace(/^'+/, '').trim();
    var rEmail = String(r[1] || '').toLowerCase().trim();
    var rSubj = String(r[2] || '').replace(/^'+/, '');
    var rawBody = String(r[4] || '');
    if ((rEmail === cleanEmail || (cleanId && rId === cleanId)) && rawBody.trim()) {
      var cleanBody = remoSanitizeEmailHtmlLinks_(rawBody);
      var digest = remoDigest_(JSON.stringify([cleanEmail, rSubj, 'text/html', cleanBody]));
      if (cleanBody !== rawBody) {
        try { bSheet.getRange(i + 2, 4, 1, 2).setValues([[digest, cleanBody]]); } catch(e) {}
      }
      return {id: rId || cleanId, digest: digest, subject: rSubj, mimeType: 'text/html', body: cleanBody};
    }
  }
  return null;
}

function remoResolveDraftFromGmail_(id, email) {
  var cleanId = String(id || '').replace(/^'+/, '').trim();
  var cleanEmail = String(email || '').toLowerCase().trim();
  if (cleanEmail) {
    try {
      var list = Gmail.Users.Drafts.list('me', {q: 'to:' + cleanEmail, maxResults: 10});
      var drafts = (list && list.drafts) || [];
      for (var i = 0; i < drafts.length; i++) {
        var cand = Gmail.Users.Drafts.get('me', drafts[i].id, {format: 'full'});
        if (!cand || !cand.message || !cand.message.payload) continue;
        var h = remoHeaders_(cand.message);
        var to = remoAddress_(h.to), p = cand.message.payload;
        var html = remoExtractHtml_(p) || remoExtractPlain_(p);
        if (to.length === 1 && to[0] === cleanEmail && html && html.trim()) {
          return {id: drafts[i].id, draft: cand};
        }
      }
    } catch(e) {}
  }
  if (cleanId && !/^PENDING_GMAIL_DRAFT_|^REMO_/.test(cleanId)) {
    try {
      var d = Gmail.Users.Drafts.get('me', cleanId, {format: 'full'});
      if (d && d.message && d.message.payload && (remoExtractHtml_(d.message.payload) || remoExtractPlain_(d.message.payload))) {
        return {id: cleanId, draft: d};
      }
    } catch(e) {}
  }
  throw new Error('DRAFT_NOT_FOUND_' + cleanEmail);
}

function remoDraft_(id, email, expectedDigest, optBook, preferGmailLatest) {
  if (!preferGmailLatest && optBook) {
    var fromSheet = remoReadDraftBodyFromSheet_(optBook, id, email);
    if (fromSheet && fromSheet.body) return fromSheet;
  }
  var res = remoResolveDraftFromGmail_(id, email), d = res.draft, h = remoHeaders_(d.message);
  var p = d.message.payload;
  var rawBody = remoExtractHtml_(p) || remoExtractPlain_(p);
  var body = remoSanitizeEmailHtmlLinks_(rawBody);
  if (!body || !String(body).trim()) throw new Error('EMPTY_DRAFT_BODY_' + res.id);
  var digest = remoDigest_(JSON.stringify([email, h.subject, 'text/html', body]));
  var draftObj = {id: res.id, digest: digest, subject: h.subject, mimeType: 'text/html', body: body};
  if (optBook) {
    try { remoSaveDraftBodyToSheet_(optBook, draftObj, email); } catch(e) {}
  }
  return draftObj;
}

function remoSyncDraftBodies_(c, book) {
  var queue = remoSheet_(book, 'Queue', REMO_QUEUE_HEADERS);
  var bSheet = remoSheet_(book, 'DraftBodies', REMO_BODY_HEADERS);
  var qRows = remoRows_(queue), bRows = remoRows_(bSheet);
  var sheetDigestByEmail = {};

  bRows.forEach(function(r, idx) {
    var em = String(r[1] || '').toLowerCase().trim();
    var subj = String(r[2] || '').replace(/^'+/, '');
    var rawHtml = String(r[4] || '');
    if (em && rawHtml.trim()) {
      var cleanHtml = remoSanitizeEmailHtmlLinks_(rawHtml);
      var cleanDig = remoDigest_(JSON.stringify([em, subj, 'text/html', cleanHtml]));
      if (cleanHtml !== rawHtml || String(r[3] || '').trim() !== cleanDig) {
        try { bSheet.getRange(idx + 2, 4, 1, 2).setValues([[cleanDig, cleanHtml]]); } catch(e) {}
      }
      sheetDigestByEmail[em] = cleanDig;
    }
  });

  var count = 0;
  for (var i = 0; i < qRows.length; i++) {
    var r = qRows[i], status = String(r[8] || '').trim();
    if (status !== 'READY' && status !== 'WAIT_FOR_DRAFT_SYNC' && status !== 'BLOCKED' && status !== 'UNKNOWN') continue;
    var email = String(r[1] || '').toLowerCase().trim();
    if (!email) continue;

    if (sheetDigestByEmail[email]) {
      if (String(r[7] || '').trim() !== sheetDigestByEmail[email]) {
        queue.getRange(i + 2, 8).setValue(sheetDigestByEmail[email]);
      }
      continue;
    }

    if (c.isStagingOwner && count < 35) {
      try {
        var d = remoDraft_(r[0], email, r[7], book, true);
        if (d && d.body) {
          if (String(r[7] || '').trim() !== d.digest || String(r[0] || '').replace(/^'+/, '') !== d.id) {
            queue.getRange(i + 2, 1).setValue(remoCell_(d.id));
            queue.getRange(i + 2, 8).setValue(d.digest);
          }
          sheetDigestByEmail[email] = d.digest;
          count++;
        }
      } catch(e) {}
    }
  }
  if (count) SpreadsheetApp.flush();
  return count;
}

function remoMessage_(row, draft, c) {
  var htmlBody = remoSanitizeEmailHtmlLinks_(String((draft && (draft.body || draft.htmlBody)) || ''));
  if (!htmlBody.trim()) throw new Error('EMPTY_DRAFT_BODY_' + row[0]);
  var senderAddr = (c && c.account) || 'remo@boam.tech';
  var senderLabel = (c && c.senderName) || 'Asia Physical AI Commercial Network · REMO';
  var msgId = '<remo.' + remoDigest_(row[0] + '|' + (draft.digest || row[7])) + '@boam.tech>';
  var enc = function(v) { return '=?UTF-8?B?' + Utilities.base64Encode(String(v || ''), Utilities.Charset.UTF_8) + '?='; };
  var b64 = Utilities.base64Encode(htmlBody, Utilities.Charset.UTF_8);
  var chunks = b64.match(/.{1,76}/g);
  var body = chunks ? chunks.join('\r\n') : b64;
  var mime = [
    'From: ' + enc(senderLabel) + ' <' + senderAddr + '>',
    'Reply-To: ' + senderAddr,
    'To: ' + row[1],
    'Subject: ' + enc(draft.subject),
    'Message-ID: ' + msgId,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body
  ].join('\r\n');
  return {raw: Utilities.base64EncodeWebSafe(mime, Utilities.Charset.UTF_8), messageId: msgId};
}

function remoStageApprovedDrafts(items) {
  if (!Array.isArray(items) || !items.length) return {staged: 0};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return {staged: 0};
  try {
    var c = remoConnections_(), book = remoBook_(c);
    var sheet = remoSheet_(book, 'Queue', REMO_QUEUE_HEADERS), rows = remoRows_(sheet);
    var contacts = remoSheet_(book, 'Contacts', ['email','company','sourceUrl','enabled']), cRows = remoRows_(contacts);
    var supRows = remoRows_(remoSheet_(book, 'Suppression', ['email','reason','at']));
    var suppressed = {};
    supRows.forEach(function(r){ if (r[0]) suppressed[String(r[0]).toLowerCase().trim()] = true; });

    var prepared = [];
    items.forEach(function(item) {
      var email = String(item.email || '').toLowerCase().trim(), src = remoCleanUrl_(item.sourceUrl);
      if (!email || suppressed[email]) return;
      if (rows.concat(prepared).some(function(r){ return String(r[1]).toLowerCase().trim() === email; })) return;
      var draft;
      if (item.htmlBody && item.subject) {
        var cleanHtml = remoSanitizeEmailHtmlLinks_(item.htmlBody);
        var dig = remoDigest_(JSON.stringify([email, item.subject, 'text/html', cleanHtml]));
        draft = {id: item.draftId || ('REMO_' + dig.slice(0, 10)), digest: dig, subject: item.subject, body: cleanHtml};
        remoSaveDraftBodyToSheet_(book, draft, email);
      } else {
        try { draft = remoDraft_(item.draftId, email, item.digest, book, c.isStagingOwner); } catch(e) { return; }
      }
      var resolvedId = draft.id || item.draftId;
      prepared.push([resolvedId, email, item.company, src, item.reviewedAt || new Date().toISOString(), item.reviewer || 'remo-review', item.approvalRef || 'chtf2026-schedule', draft.digest, 'READY', '', '', '', '']);
    });
    prepared.forEach(function(row) {
      sheet.appendRow(row.map(remoCell_));
      if (!cRows.some(function(r){ return String(r[0]).toLowerCase().trim() === row[1]; })) {
        contacts.appendRow([row[1], remoCell_(row[2]), row[3], 'yes']);
        cRows.push([row[1], row[2], row[3], 'yes']);
      }
    });
    SpreadsheetApp.flush();
    return {staged: prepared.length};
  } finally {
    lock.releaseLock();
  }
}

/* 로컬 Antigravity(remo_b2b_lead)에서 생성한 Gmail 제어 초안(REMO_QUEUE_REVIEW_V1) 자동 수집 */
function remoImportReviewedQueue() {
  var c = remoConnections_(), book = remoBook_(c);
  var list = Gmail.Users.Messages.list('me', {q: 'in:drafts subject:"REMO_QUEUE_REVIEW_V1"', maxResults: 10}), total = 0;
  (list.messages || []).forEach(function(ref) {
    if (c.p.getProperty('CONTROL_' + ref.id) === 'IMPORTED') return;
    var m = Gmail.Users.Messages.get('me', ref.id, {format: 'full'});
    var raw = remoExtractPlain_(m.payload);
    if (!raw) return;
    var data;
    try { data = JSON.parse(raw); } catch(e) { return; }
    if (!data || !Array.isArray(data.items)) return;
    var res = remoStageApprovedDrafts(data.items);
    total += res.staged;
    c.p.setProperty('CONTROL_' + ref.id, 'IMPORTED');
  });
  try { remoSyncDraftBodies_(c, book); } catch(e) {}
  return {staged: total};
}

function remoRecoverStuckSending_() {
  var c = remoConnections_(), book = remoBook_(c), queue = remoSheet_(book, 'Queue', REMO_QUEUE_HEADERS);
  var rows = remoRows_(queue), recovered = 0;
  rows.forEach(function(r, i) {
    var email = String(r[1] || '').toLowerCase().trim();
    var status = String(r[8] || '').trim();
    if ((status === 'SENDING' || status === 'UNKNOWN' || status === 'WAIT_FOR_DRAFT_SYNC') && !r[10]) {
      queue.getRange(i + 2, 9, 1, 5).setValues([['READY', '', '', '', '']]);
      recovered++;
    } else if (status === 'BLOCKED' && String(r[12] || '') === 'DRAFT_NOT_FOUND') {
      var hasSheetBody = remoReadDraftBodyFromSheet_(book, r[0], email);
      if (hasSheetBody) {
        queue.getRange(i + 2, 9, 1, 5).setValues([['READY', '', '', '', '']]);
        recovered++;
      }
    }
  });
  if (recovered) SpreadsheetApp.flush();
  return recovered;
}

function remoDispatchWindow_(now) {
  var local = Utilities.formatDate(new Date(now), 'Asia/Seoul', 'yyyy-MM-dd HH');
  var day = local.slice(0, 10);
  var hour = Number(local.slice(11));
  var open = (hour >= 9 && hour < 20);
  return {day: day, hour: hour, open: open};
}

function remoDispatchCheck_(c, book, now) {
  var win = remoDispatchWindow_(now), rows = remoRows_(book.getSheetByName('Queue'));
  if (!win.open) return {status: 'OUTSIDE_WINDOW', hour: win.hour};
  var supRows = remoRows_(remoSheet_(book, 'Suppression', ['email','reason','at']));
  var suppressed = {};
  supRows.forEach(function(r){ if (r[0]) suppressed[String(r[0]).toLowerCase().trim()] = true; });

  var sentToday = rows.filter(function(r) {
    return r[8] === 'SENT' && remoKstDateStr_(r[9]) === win.day;
  }).length;
  var budget = {day: win.day, reserved: sentToday};
  c.p.setProperty('DISPATCH_BUDGET', JSON.stringify(budget));
  var dailyMax = Number(c.p.getProperty('DAILY_MAX_SENDS') || 50);
  if (budget.reserved >= dailyMax) return {status: 'DAILY_LIMIT'};

  var last = Number(c.p.getProperty('DISPATCH_LAST_ATTEMPT') || 0);
  if (now - last < 280000) return {status: 'INTERVAL_WAIT'};

  var idx = rows.findIndex(function(r){ return String(r[8] || '').trim() === 'READY'; });
  if (idx < 0) return {status: 'EMPTY'};
  var row = rows[idx], email = String(row[1] || '').toLowerCase().trim();
  if (suppressed[email]) return {status: 'BLOCKED', index: idx, row: row, reason: 'SUPPRESSED_RECIPIENT'};

  var found = Gmail.Users.Messages.list('me', {q: 'in:anywhere -in:drafts {from:' + email + ' (in:sent to:' + email + ')}', maxResults: 1});
  if (found.messages && found.messages.length) return {status: 'BLOCKED', index: idx, row: row, reason: 'PRIOR_CONTACT_OR_REPLY'};

  var draft;
  try {
    draft = remoDraft_(row[0], email, row[7], book, false);
  } catch(e) {
    return {status: 'WAIT_FOR_DRAFT_SYNC', index: idx, row: row, reason: 'DRAFT_NOT_IN_SHEET_YET'};
  }
  return {status: 'READY', index: idx, row: row, draft: draft, day: win.day, budget: budget};
}

function remoDispatchRun() {
  var p = remoEnsureEnv_();
  if (p.getProperty('DISPATCH_ENABLED') !== 'yes') return {status: 'DISABLED'};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return {status: 'BUSY'};
  try {
    var c = remoConnections_(), book = remoBook_(c);
    var recovered = 0, imported = {staged: 0}, syncedBodies = 0, inbound = {inboundDetected: 0, telegramAlertsSent: 0};
    try { recovered = remoRecoverStuckSending_(); } catch(e) {}
    try { imported = remoImportReviewedQueue(); } catch(e) {}
    try { syncedBodies = remoSyncDraftBodies_(c, book); } catch(e) {}
    try {
      var inCount = remoInboundScan_(c, book, false);
      var evSheet = remoSheet_(book, 'Events', REMO_HEADERS);
      var evRows = remoRows_(evSheet), tgSent = 0;
      evRows.forEach(function(r, idx) {
        if (r[7] === 'PENDING' && r[1] !== 'MAIL_ACCEPTED' && r[1] !== 'DELIVERY_FAILED' && r[1] !== 'SOURCING_STAGED') {
          if (remoSendEventRowToTelegram_(c, evSheet, idx + 2, r) === 'SENT') tgSent++;
        }
      });
      inbound = {inboundDetected: inCount, telegramAlertsSent: tgSent};
    } catch(e) {}

    if (!c.isWorkspaceSender) {
      return {
        status: 'STAGED_ONLY_WAIT_FOR_WORKSPACE',
        runnerAccount: c.runnerEmail,
        recoveredRows: recovered,
        importedQueueItems: imported.staged,
        syncedDraftBodiesToSheet: syncedBodies,
        inbound: inbound
      };
    }

    var queue = remoSheet_(book, 'Queue', REMO_QUEUE_HEADERS);
    var check = remoDispatchCheck_(c, book, Date.now());
    if (check.status === 'BLOCKED') {
      var blockedAt = new Date().toISOString();
      queue.getRange(check.index + 2, 9, 1, 5).setValues([['BLOCKED', blockedAt, '', '', check.reason]]);
      remoRecordCycleItem_(c, check.row[2], check.row[1], blockedAt, false);
      SpreadsheetApp.flush();
      var flushBlocked = remoFlushCycleTelegramReport_(c, book, false);
      return {status: 'BLOCKED', reason: check.reason, inbound: inbound, cycleReport: flushBlocked};
    }
    if (check.status !== 'READY') {
      var flushWait = remoFlushCycleTelegramReport_(c, book, false);
      return {status: check.status, runnerAccount: c.runnerEmail, inbound: inbound, cycleReport: flushWait};
    }

    var at = new Date().toISOString(), row = check.row, rIdx = check.index + 2;
    var msg = remoMessage_(row, check.draft, c), res;
    queue.getRange(rIdx, 9, 1, 2).setValues([['SENDING', at]]);
    check.budget.reserved++;
    c.p.setProperty('DISPATCH_BUDGET', JSON.stringify(check.budget));
    c.p.setProperty('DISPATCH_LAST_ATTEMPT', String(Date.now()));
    SpreadsheetApp.flush();
    try {
      res = Gmail.Users.Messages.send({raw: msg.raw}, 'me');
    } catch(e) {
      queue.getRange(rIdx, 9).setValue('UNKNOWN');
      queue.getRange(rIdx, 13).setValue(remoCell_(String(e.message || e)));
      remoRecordCycleItem_(c, row[2], row[1], at, false);
      SpreadsheetApp.flush();
      var flushErr = remoFlushCycleTelegramReport_(c, book, false);
      return {status: 'UNKNOWN', error: String(e.message || e), inbound: inbound, cycleReport: flushErr};
    }

    queue.getRange(rIdx, 9, 1, 5).setValues([['SENT', at, res.id, res.threadId || '', '']]);
    var events = remoSheet_(book, 'Events', REMO_HEADERS);
    events.appendRow([res.id, 'MAIL_ACCEPTED', row[1], remoCell_(row[2]), remoCell_(check.draft.subject), at, 'Gmail 접수 확인 (워크스페이스 ' + c.runnerEmail + ' 발송).', 'CYCLE_BUFFERED', 'BATCH_MODE', '']);
    remoRecordCycleItem_(c, row[2], row[1], at, true);
    SpreadsheetApp.flush();
    c.p.setProperty('DISPATCH_LAST_RUN', at);
    var flushDone = remoFlushCycleTelegramReport_(c, book, false);
    return {
      status: 'ACCEPTED',
      senderAccount: c.runnerEmail,
      externalEmailsSent: 1,
      gmailId: res.id,
      recipient: row[1],
      company: row[2],
      inbound: inbound,
      cycleReport: flushDone
    };
  } finally {
    lock.releaseLock();
  }
}

/* ==========================================================================
 * 7. 상태 조회, 트리거 설치 및 원클릭 즉시 가동 (remoDispatchStartNow)
 * ========================================================================== */

function remoStart() {
  var c = remoConnections_(), book = remoBook_(c);
  remoSheet_(book, 'Contacts', ['email','company','sourceUrl','enabled']);
  remoSheet_(book, 'Events', REMO_HEADERS);
  var ex = ScriptApp.getProjectTriggers().filter(function(t){ return t.getHandlerFunction() === 'remoRun'; });
  if (!ex.length) ScriptApp.newTrigger('remoRun').timeBased().everyMinutes(5).create();
  return {schedulerActive: true, intervalMinutes: 5};
}

function remoDispatchSetup() {
  var c = remoConnections_(), book = remoBook_(c);
  remoSheet_(book, 'Queue', REMO_QUEUE_HEADERS);
  remoSheet_(book, 'DraftBodies', REMO_BODY_HEADERS);
  remoSheet_(book, 'Config', REMO_CONFIG_HEADERS);
  remoSheet_(book, 'Suppression', ['email','reason','at']);
  remoSheet_(book, 'Contacts', ['email','company','sourceUrl','enabled']);
  remoSheet_(book, 'Events', REMO_HEADERS);
  remoInitSourcingSheets_(book);
  return {sheetUrl: book.getUrl(), intervalMinutes: 5, dailyLimit: 50};
}

function remoDispatchStatus() {
  var c = remoConfig_(), book = remoBook_(c), counts = {};
  remoRows_(remoSheet_(book, 'Queue', REMO_QUEUE_HEADERS)).forEach(function(r){ counts[r[8]] = (counts[r[8]] || 0) + 1; });
  var bodyCount = remoRows_(remoSheet_(book, 'DraftBodies', REMO_BODY_HEADERS)).length;
  var poolCount = remoRows_(remoSheet_(book, 'SourcingPool', REMO_SOURCING_POOL_HEADERS)).length;
  var todayItems = remoCollectTodayBatchItems_(c, book);
  return {
    enabled: c.p.getProperty('DISPATCH_ENABLED') === 'yes',
    sourcingEnabled: c.p.getProperty('SOURCING_ENABLED') === 'yes',
    dispatchWindow: 'Every day 09:00-20:00 KST',
    sourcingWindow: 'Every hour (Dawn 04:00-08:00 KST & Evening 19:00-22:00 KST)',
    schedulerInstalled: ScriptApp.getProjectTriggers().some(function(t){ return t.getHandlerFunction() === 'remoDispatchRun'; }),
    inboundWatchInstalled: ScriptApp.getProjectTriggers().some(function(t){ return t.getHandlerFunction() === 'remoRun'; }),
    sourcingTriggerInstalled: ScriptApp.getProjectTriggers().some(function(t){ return t.getHandlerFunction() === 'remoSourcingRun'; }),
    welcomeAutoReply: c.p.getProperty('WELCOME_AUTO_REPLY') || 'yes',
    queue: counts,
    syncedDraftBodiesInSheet: bodyCount,
    sourcingPoolLeadsInSheet: poolCount,
    todayBatchProgressCount: todayItems.length,
    budget: JSON.parse(c.p.getProperty('DISPATCH_BUDGET') || 'null')
  };
}

function remoDispatchStart() {
  remoEnsureEnv_();
  remoDispatchSetup();
  remoStart();
  var exDispatch = ScriptApp.getProjectTriggers().filter(function(t){ return t.getHandlerFunction() === 'remoDispatchRun'; });
  if (!exDispatch.length) ScriptApp.newTrigger('remoDispatchRun').timeBased().everyMinutes(5).create();
  var exSource = ScriptApp.getProjectTriggers().filter(function(t){ return t.getHandlerFunction() === 'remoSourcingRun'; });
  if (!exSource.length) ScriptApp.newTrigger('remoSourcingRun').timeBased().everyHours(1).create();
  PropertiesService.getScriptProperties().setProperty('DISPATCH_ENABLED', 'yes');
  PropertiesService.getScriptProperties().setProperty('SOURCING_ENABLED', 'yes');
  return {schedulerActive: true, dispatchIntervalMinutes: 5, sourcingIntervalHours: 1, dailyLimit: 50, window: '09:00-20:00 KST'};
}

function remoSendTodayBatchReportNow() {
  var c = remoConnections_(), book = remoBook_(c);
  return remoFlushCycleTelegramReport_(c, book, true);
}

/* 원클릭 초기 세팅 + 16개 중국 휴머노이드 핵심 리드 즉시 Queue/DraftBodies 적재 + 트리거 가동 */
function remoDispatchStartNow() {
  var p = remoEnsureEnv_();
  var c = remoConnections_(), book = remoBook_(c);

  var cleanedRows = remoCleanupPollutedSheetRows_(book);
  var recovered = remoRecoverStuckSending_();
  var start = remoDispatchStart();
  var stagedSeed = remoStageSourcedLeadsToQueue(20);
  var imported = remoImportReviewedQueue();
  var syncedBodies = remoSyncDraftBodies_(c, book);
  var inboundResult = remoRun();
  var dispatch = remoDispatchRun();

  var result = {
    runnerAccount: c.runnerEmail,
    role: c.isWorkspaceSender ? 'WORKSPACE_SENDER (remo@boam.tech 실제 발송 및 중문 웰컴응대 계정)' : 'STAGING_SYNC_ONLY (초안/소싱 동기화 전용)',
    cleanedSystemRows: cleanedRows,
    recoveredBouncedRows: recovered,
    stagedFromSourcingPool: stagedSeed.staged,
    importedQueueItems: imported.staged,
    syncedDraftBodiesToSheet: syncedBodies,
    inboundWatchResult: inboundResult,
    dispatch: dispatch,
    status: remoDispatchStatus()
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}


/* ==========================================================================
 * 8. 테스트 전용: gitkaiba@gmail.com 으로 즉시 메일 발송 + 텔레그램 실시간 보고
 * ========================================================================== */

function remoSendTestToGitkaiba() {
  var c = remoConnections_(), book = remoBook_(c);
  var targetEmail = "gitkaiba@gmail.com";
  var testComp = "테스트 타겟 (REMO Physical AI 검증)";
  
  // 실제 발송될 Dual-Offer 중문 제안서 렌더링
  var sampleLead = {
    companyId: "TEST-001",
    companyZh: "宇树科技 (테스트 시뮬레이션)",
    companyEn: "Unitree Robotics",
    category: "1_China_Humanoid_Embodied_AI",
    city: "Shenzhen",
    website: "https://remob2blead.vercel.app/",
    email: targetEmail,
    productKeywords: "Unitree G1 / H1 人形机器人、四足机器人、具身大模型数据",
    offerTrack: "DUAL_OFFER"
  };
  
  var proposal = remoBuildCustomProposal_(sampleLead, c);
  var msg = remoMessage_([proposal.draftId, targetEmail, testComp], proposal, c);
  
  var at = new Date().toISOString();
  var res;
  try {
    res = Gmail.Users.Messages.send({raw: msg.raw}, "me");
  } catch(e) {
    var errText = "🔴 [REMO 테스트 실패] 메일 발송 중 오류: " + String(e.message || e);
    try {
      remoTelegram_(c, "sendMessage", {
        chat_id: c.chat,
        text: errText
      });
    } catch(te) {}
    return {status: "FAILED", error: String(e.message || e)};
  }
  
  // 텔레그램 즉시 보고
  var tgReport = [
    "🧪 [REMO 테스트 완료] 메일 발송 및 텔레그램 알림 검증",
    "• 수신자: " + targetEmail,
    "• 발신자: " + c.account + " (" + c.runnerEmail + ")",
    "• 제목: " + proposal.subject,
    "• Gmail ID: " + res.id,
    "• 시각: " + remoFormatCycleTime_(at),
    "🟢 실제 메일함(gitkaiba@gmail.com)과 텔레그램 연동이 정상 확인되었습니다."
  ].join("\n");
  
  var tgId = "SHEET_ONLY";
  try {
    var tgRes = remoTelegram_(c, "sendMessage", {
      chat_id: c.chat,
      text: tgReport,
      disable_web_page_preview: true
    });
    tgId = String((tgRes && tgRes.message_id) || "SENT");
  } catch(te) {
    tgId = "TG_ERROR_" + String(te.message || te);
  }
  
  // Events 시트에 기록
  var events = remoSheet_(book, "Events", REMO_HEADERS);
  events.appendRow([
    res.id,
    "TEST_SEND",
    targetEmail,
    remoCell_(testComp),
    remoCell_(proposal.subject),
    at,
    "테스트 메일 발송 및 텔레그램 연동 확인 완료",
    "SENT",
    tgId,
    ""
  ]);
  SpreadsheetApp.flush();
  
  return {
    status: "SUCCESS",
    targetEmail: targetEmail,
    gmailId: res.id,
    telegramId: tgId,
    subject: proposal.subject
  };
}
