/* REMO · Asia Physical AI Commercial Network (보엠 주식회사 / remo@boam.tech)
 * Google Apps Script 통합 자동발송 · 회신감시 · 웰컴응대 · 텔레그램보고 전용 엔진 (Code.gs)
 *
 * [역할 분담 아키텍처 — 말랑.BEST(Code.gs) 동일 구조]
 * - 리드 소싱 · 기업별 심층 리서치 · 맞춤형 HTML 제안서(중문 간체 / 영문, F+T 심리적 락인) 작성은
 *   클라우드에서 매일 자동 실행되는 Gemini(아르곤) 스케줄러가 수행하여 구글 시트의 DraftBodies 와 Queue(READY) 탭에 적재합니다.
 * - 본 GAS(Code.gs)에는 어떠한 고정 업체 리스트나 기계적 소싱 코드도 들어있지 않으며,
 *   오직 구글 시트(DraftBodies · Queue)에 적재된 리서치 완료 제안서를 읽어서:
 *   1) 주간(09:00~20:00 KST) 5분 간격 순차 발송 (일일 최대 50건)
 *   2) 하루 발송 배치 완료 시 텔레그램 단 1회 통합 보고 (🔵[REMO] 발송보고 N건)
 *   3) 시스템·반송 메일(mailer-daemon, workspacesupport 등) 100% 격리 및 Suppression 자동 차단
 *   4) 실제 회신·문의 고객 대상 웰컴 양식(REMO_WELCOME_HTML) 자동 응대 및 텔레그램 즉시 알림(🟢/🟡)만 전담합니다.
 */

var REMO_HEADERS = ['messageId','kind','email','company','subject','at','excerpt','status','telegramId','errorCode'];
var REMO_QUEUE_HEADERS = ['draftId','email','company','sourceUrl','reviewedAt','reviewer','approvalRef','digest','status','reservedAt','gmailId','threadId','errorCode'];
var REMO_BODY_HEADERS = ['draftId','email','subject','digest','htmlBody','syncedAt'];
var REMO_CONFIG_HEADERS = ['key','value','updatedAt'];

var REMO_DEFAULT_ENV = {
  REMO_SHEET_ID: '1dz9shE_3vIY43d7ClaTK6ODpzMCIDRKOZT92HS25b-s',
  TELEGRAM_BOT_TOKEN: '', // 보안: 구글 시트 Config 탭에서 읽어와 ScriptProperties에 자동 동기화
  TELEGRAM_CHAT_ID: '',   // 보안: 구글 시트 Config 탭에서 읽어와 ScriptProperties에 자동 동기화
  DISPATCH_ENABLED: 'no', // 안전 기본값: 시트 Config 탭에서 yes로 변경 시 발송 개시
  DISPATCH_DAYTIME: 'yes',
  PRIMARY_ACCOUNT: 'remo@boam.tech',
  WORKSPACE_ACCOUNT: 'remo@boam.tech',
  STAGING_ACCOUNT: 'gitkaiba@gmail.com',
  SENDER_EMAIL: 'remo@boam.tech',
  SENDER_NAME: 'Asia Physical AI Commercial Network · REMO',
  LANDING_URL: 'https://remob2blead.vercel.app',
  WECHAT_ID: 'zeeeeeyul',
  CHTF_MEETING_DATES: '2026年11月26日–11月29日（深圳展会期间现场面谈 · 欢迎提前通过微信/领英预约）',
  DAILY_MAX_SENDS: '50',
  WELCOME_AUTO_REPLY: 'yes'
};

/* 회신·문의 고객 대상 중문/영문 웰컴 자동응대 양식 (REMO_WELCOME_HTML_TEMPLATE — 11/26~11/29 심천 일정 및 위챗/링크드인 안내 반영) */
var REMO_WELCOME_HTML_TEMPLATE = [
  '<div style="background:#f3f5f8;padding:28px 12px;font-family:\'PingFang SC\',\'Microsoft YaHei\',\'Apple SD Gothic Neo\',Arial,sans-serif;color:#18384b;">',
  '  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dfe5ec;border-radius:4px;overflow:hidden;">',
  '    <div style="background:#16364d;padding:26px 28px;color:#ffffff;">',
  '      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.5px;color:#60a5fa;">ASIA PHYSICAL AI COMMERCIAL NETWORK · REMO | B2B EMBODIED AI &amp; ROBOTICS PARTNER</p>',
  '      <h1 style="margin:0;font-size:21px;line-height:1.45;font-weight:700;color:#ffffff;">感谢 {{company}} 的回复 — 具身智能数据与海外/亚洲渠道合作对接</h1>',
  '    </div>',
  '    <div style="padding:28px 28px;font-size:14.5px;line-height:1.85;color:#2c3e50;">',
  '      <p style="margin:0 0 16px;">您好，<strong>{{name}}</strong>（<strong>{{company}}</strong>）：<br>非常感谢您的回复与关注！我们已收到贵司的来信，正在根据贵司的产品线与研发方向整理专属合作资料。</p>',
  '      {{customContextBlock}}',
  '      <p style="margin:0 0 18px;">为了让接下来的沟通更高效，您可以直接<strong>回复本邮件（remo@boam.tech）</strong>，或提前通过<strong>微信（WeChat） / 领英（LinkedIn）</strong>告知您目前最关注的合作模块：</p>',
  '      <div style="background:#f4f7fa;border:1px solid #dce4ec;border-left:4px solid #16364d;border-radius:6px;padding:18px 20px;margin:20px 0;">',
  '        <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#16364d;">[贵司可对接的 3 大核心合作模块]</p>',
  '        <p style="margin:0 0 10px;font-size:14px;line-height:1.8;color:#334155;"><strong>1. 真实场景多模态数据与 REMO 3D 合成数据供应：</strong>按贵司机器人/灵巧手自由度（DoF）与传感器配置，定制采集真实工业、商业非结构化场景遥操作（Teleoperation）数据，并结合 REMO 3D 动作捕捉与 Isaac Sim 仿真合成数据，大幅降低大模型泛化训练成本。</p>',
  '        <p style="margin:0 0 10px;font-size:14px;line-height:1.8;color:#334155;"><strong>2. 韩国及亚洲市场总代分销 · 付费 PoC · 本地 SI：</strong>直接对接韩国及亚洲智能制造工厂、物流仓储、商业连锁及顶尖高校科研院所，提供样机采购、付费试点（Paid PoC）、本地化技术文档与工程师售后维保。</p>',
  '        <p style="margin:0;font-size:14px;line-height:1.8;color:#334155;"><strong>3. 11月26日–11月29日 中国深圳展会期间 1:1 现场面谈：</strong>我们核心团队将于 <strong>11/26–11/29</strong> 在<strong>深圳展会现场及南山/宝安区</strong>驻点洽谈，可当面演示数据样本并深入敲定合作细节。</p>',
  '      </div>',
  '      <div style="background:#f9fafb;border:1px solid #e2e8f0;border-radius:6px;padding:16px 20px;margin:20px 0;font-size:13.5px;line-height:1.8;color:#334155;">',
  '        <strong style="color:#16364d;">[快速对接指南 · 欢迎微信/领英提前联系]</strong><br>',
  '        • <strong>数据合作咨询：</strong>请告知目标模态（双臂/灵巧手/全身步态）、需求时长及目标格式（RLDS / LeRobot / HDF5）<br>',
  '        • <strong>海外渠道与 PoC 咨询：</strong>请附贵司主力机型资料（Brochure）、出海标准报价区间及期望合作模式<br>',
  '        • <strong>11/26–11/29 深圳面谈预约：</strong>请回复您的<strong>微信号（WeChat ID）或领英（LinkedIn）</strong>及方便的时间段',
  '      </div>',
  '      <div style="text-align:center;margin:28px 0 16px;">',
  '        <a href="https://remob2blead.vercel.app" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#16364d;color:#ffffff;padding:13px 22px;text-decoration:none;font-weight:700;border-radius:6px;font-size:14px;margin:0 6px 10px;">查看 REMO 合作方案</a>',
  '        <a href="https://remob2blead.vercel.app" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#fee500;color:#16364d;padding:13px 22px;text-decoration:none;font-weight:700;border-radius:6px;font-size:14px;margin:0 6px 10px;">관심문의 · 미팅 요청하기 (预约会面)</a>',
  '      </div>',
  '    </div>',
  '    <div style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e6ebf0;font-size:12.5px;line-height:1.8;color:#64748b;">',
  '      <strong>Asia Physical AI Commercial Network · REMO (BOAM Inc.)</strong><br>',
  '      具身智能数据合作 · 跨境市场拓展 · 机器人系统集成<br>',
  '      Email: <a href="mailto:remo@boam.tech" style="color:#16364d;font-weight:600;text-decoration:none;">remo@boam.tech</a> · Web: <a href="https://remob2blead.vercel.app" target="_blank" rel="noopener noreferrer" style="color:#16364d;font-weight:600;text-decoration:none;">remob2blead.vercel.app</a>',
  '    </div>',
  '  </div>',
  '</div>'
].join('\n');

/* ==========================================================================
 * 1. 공통 유틸리티, 링크 리디렉션 정화 및 환경설정 동기화 (시트 Config = Source of Truth)
 * ========================================================================== */

function remoEnsureEnv_() {
  var p = PropertiesService.getScriptProperties(), cur = p.getProperties(), up = {};
  for (var k in REMO_DEFAULT_ENV) {
    if (!cur[k] && REMO_DEFAULT_ENV[k]) {
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
  var s = remoSheet_(book, 'Config', REMO_CONFIG_HEADERS);
  var rows = remoRows_(s), sheetMap = {};
  rows.forEach(function(r, idx) {
    var k = String(r[0] || '').trim(), v = String(r[1] || '').trim();
    if (k) sheetMap[k] = {val: v, rowIdx: idx + 2};
  });
  var cur = p.getProperties(), toSaveInProp = {};
  var sharedKeys = [
    'REMO_SHEET_ID', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'SENDER_EMAIL', 'SENDER_NAME',
    'PRIMARY_ACCOUNT', 'WORKSPACE_ACCOUNT', 'STAGING_ACCOUNT', 'LANDING_URL', 'WECHAT_ID',
    'CHTF_MEETING_DATES', 'DAILY_MAX_SENDS', 'DISPATCH_ENABLED', 'WELCOME_AUTO_REPLY',
    'GITHUB_TOKEN', 'GITHUB_REPO'
  ];
  sharedKeys.forEach(function(k) {
    var sEntry = sheetMap[k];
    var sVal = sEntry ? String(sEntry.val || '').trim() : '';
    var pVal = String(cur[k] || '').trim();
    if (sVal) {
      if (sVal !== pVal) {
        toSaveInProp[k] = sVal.replace(/^'+/, '');
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
    staging: p.getProperty('STAGING_ACCOUNT') || 'gitkaiba@gmail.com',
    landingUrl: p.getProperty('LANDING_URL') || 'https://remob2blead.vercel.app',
    token: (p.getProperty('TELEGRAM_BOT_TOKEN') || '').replace(/^'+/, '').trim(),
    chat: (p.getProperty('TELEGRAM_CHAT_ID') || '').replace(/^'+/, '').trim(),
    book: sheetId,
    bookObj: book
  };
}

function remoTelegram_(c, method, payload) {
  if (!c.token || !c.chat) return {id: c.chat || 'NO_CHAT', message_id: 'SHEET_ONLY'};
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
 * 2. 하루 한 타임 발송 완료 시 텔레그램 일괄 발송 보고 (🔵[REMO] 발송보고 N건)
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
  var header = '🔵[REMO] 발송보고 ' + items.length + '건';
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
    'REMO 일괄보고',
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
 * 3. 고객 회신·문의 기본 웰컴 양식(REMO_WELCOME_HTML) 렌더링 및 자동 회신
 * ========================================================================== */

function remoRenderWelcomeEmail_(contactName, company, customContextText, c) {
  var safeName = remoEscapeHtml_(String(contactName || '负责人').trim() || '负责人');
  var safeCompany = remoEscapeHtml_(String(company || '贵司').trim() || '贵司');
  var customBlock = '';
  if (customContextText && String(customContextText).trim()) {
    customBlock = '<p style="margin: 0 0 16px; font-size: 14px; color: #334155; line-height: 1.8;">' +
      remoEscapeHtml_(String(customContextText).trim()).replace(/\n/g, '<br>') +
      '</p>';
  }
  var rendered = REMO_WELCOME_HTML_TEMPLATE
    .replace(/\{\{\s*name\s*\}\}/g, safeName)
    .replace(/\{\{\s*company\s*\}\}/g, safeCompany)
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
  var subj = '[REMO · Physical AI Network] 感谢 ' + compName + ' 的回复 · 具身数据样本与亚洲渠道合作对接 (11/26-11/29 深圳)';
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
      '웰컴 양식(REMO_WELCOME_HTML) 자동 회신 완료',
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
 * 4. 수신함 회신·문의·수신거부·반송 상시 감시 (시스템·반송·도메인안내 메일 완벽 차단)
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
  if (/报价|价格|预算|样本|样品|数据集|采集|遥操作|合成数据|代理|总代|渠道|韩国|出海|系统集成|PoC|高交会|CHTF|深圳|面谈|会议|微信|WeChat|LinkedIn|领英|견적|단가|샘플|데이터|총판|quote|pricing|sample|dataset|teleop|distribution|meeting/i.test(combined)) {
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
  return /机器人|人形|具身智能|数据集|遥操作|灵巧手|传感器|合成数据|仿真|算法|训练|韩国|代理|渠道|出海|集成|高交会|CHTF|深圳|合作|报价|样品|微信|领英|humanoid|robot|embodied|dataset|teleop|synthetic|distribution|partner|휴머노이드|로봇|데이터|총판/i.test(combined);
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
        var customLine = '已收到贵司关于《' + String(h.subject || '合作垂询').slice(0, 45) + '》的来信，我们团队正为您匹配相应的数据样本与渠道合作方案。';
        var wRes = remoSendWelcomeReply(fromEmail, fromName, company, customLine, message.threadId, h['message-id'] || '');
        welcomeNote = wRes.mode === 'SENT' ? ' [웰컴양식 자동회신 완료]' : ' [웰컴양식 회신초안 생성]';
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
    remoSystemInbound_(email, row[4], row[6], {})
  ) {
    sheet.getRange(idx, 8, 1, 2).setValues([['SENT', 'BATCH_OR_FILTERED']]);
    return 'SKIPPED_BATCH';
  }
  sheet.getRange(idx, 8).setValue('SENDING');
  SpreadsheetApp.flush();
  var headerTitle = '🔔 [REMO] 메일 알림';
  if (kind === 'LEAD_REPLY') headerTitle = '🟢 [REMO] 기업 후속 회신 도착';
  else if (kind === 'NEW_INQUIRY') headerTitle = '🟡 [REMO] 새 외부 문의 도착';
  else if (kind === 'OPT_OUT') headerTitle = '⚪️ [REMO] 수신거부 접수 (자동 차단 완료)';

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
      if (kind === 'MAIL_ACCEPTED' || kind === 'DELIVERY_FAILED') {
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
 * 5. 공유 시트(DraftBodies · Queue) 동적 동기화 및 5분 간격 순차 발송 엔진
 * ========================================================================== */

function remoSaveDraftBodyToSheet_(book, draftObj, email) {
  if (!book || !draftObj || !(draftObj.body || draftObj.htmlBody)) return;
  var bSheet = remoSheet_(book, 'DraftBodies', REMO_BODY_HEADERS);
  var bRows = remoRows_(bSheet);
  var cleanId = String(draftObj.id || '').replace(/^'+/, '').trim();
  var cleanEmail = String(email || '').toLowerCase().trim();
  var cleanHtml = remoSanitizeEmailHtmlLinks_(draftObj.body || draftObj.htmlBody);
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
      return {id: rId || cleanId, digest: digest, subject: rSubj, mimeType: 'text/html', body: cleanBody, htmlBody: cleanBody};
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
  var draftObj = {id: res.id, digest: digest, subject: h.subject, mimeType: 'text/html', body: body, htmlBody: body};
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
      if ((item.htmlBody || item.body) && item.subject) {
        var cleanHtml = remoSanitizeEmailHtmlLinks_(item.htmlBody || item.body);
        var dig = remoDigest_(JSON.stringify([email, item.subject, 'text/html', cleanHtml]));
        draft = {id: item.draftId || ('REMO_' + dig.slice(0, 10)), digest: dig, subject: item.subject, body: cleanHtml, htmlBody: cleanHtml};
        remoSaveDraftBodyToSheet_(book, draft, email);
      } else {
        try { draft = remoDraft_(item.draftId, email, item.digest, book, c.isStagingOwner); } catch(e) { return; }
      }
      var resolvedId = draft.id || item.draftId;
      prepared.push([resolvedId, email, item.company, src, item.reviewedAt || new Date().toISOString(), item.reviewer || 'gemini-research', item.approvalRef || 'owner-schedule', draft.digest, 'READY', '', '', '', '']);
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

  var isTestEmail = (email === 'gitkaiba@gmail.com' || email === 'humanopeace@gmail.com');
  if (!isTestEmail) {
    var found = Gmail.Users.Messages.list('me', {q: 'in:anywhere -in:drafts {from:' + email + ' (in:sent to:' + email + ')}', maxResults: 1});
    if (found.messages && found.messages.length) return {status: 'BLOCKED', index: idx, row: row, reason: 'PRIOR_CONTACT_OR_REPLY'};
  }

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
  var c = remoConnections_(), book = remoBook_(c);
  if (c.p.getProperty('DISPATCH_ENABLED') !== 'yes') return {status: 'DISABLED_BY_CONFIG'};
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return {status: 'BUSY'};
  try {
    var recovered = 0, imported = {staged: 0}, syncedBodies = 0, inbound = {inboundDetected: 0, telegramAlertsSent: 0};
    try { recovered = remoRecoverStuckSending_(); } catch(e) {}
    try { imported = remoImportReviewedQueue(); } catch(e) {}
    try { syncedBodies = remoSyncDraftBodies_(c, book); } catch(e) {}
    try {
      var inCount = remoInboundScan_(c, book, false);
      var evSheet = remoSheet_(book, 'Events', REMO_HEADERS);
      var evRows = remoRows_(evSheet), tgSent = 0;
      evRows.forEach(function(r, idx) {
        if (r[7] === 'PENDING' && r[1] !== 'MAIL_ACCEPTED' && r[1] !== 'DELIVERY_FAILED') {
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
 * 6. 상태 조회, 트리거 설치 및 원클릭 가동 (remoDispatchStartNow)
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
  return {sheetUrl: book.getUrl(), intervalMinutes: 5, dailyLimit: 50};
}

function remoDispatchStatus() {
  var c = remoConfig_(), book = remoBook_(c), counts = {};
  remoRows_(remoSheet_(book, 'Queue', REMO_QUEUE_HEADERS)).forEach(function(r){ counts[r[8]] = (counts[r[8]] || 0) + 1; });
  var bodyCount = remoRows_(remoSheet_(book, 'DraftBodies', REMO_BODY_HEADERS)).length;
  var todayItems = remoCollectTodayBatchItems_(c, book);
  return {
    enabled: c.p.getProperty('DISPATCH_ENABLED') === 'yes',
    dispatchWindow: 'Every day 09:00-20:00 KST',
    schedulerInstalled: ScriptApp.getProjectTriggers().some(function(t){ return t.getHandlerFunction() === 'remoDispatchRun'; }),
    inboundWatchInstalled: ScriptApp.getProjectTriggers().some(function(t){ return t.getHandlerFunction() === 'remoRun'; }),
    welcomeAutoReply: c.p.getProperty('WELCOME_AUTO_REPLY') || 'yes',
    queue: counts,
    syncedDraftBodiesInSheet: bodyCount,
    todayBatchProgressCount: todayItems.length,
    budget: JSON.parse(c.p.getProperty('DISPATCH_BUDGET') || 'null')
  };
}

function remoDispatchStart() {
  remoEnsureEnv_();
  remoDispatchSetup();
  remoStart();
  // 혹시 이전에 등록된 불필요한 GAS 소싱 트리거가 있으면 자동 제거 (소싱/리서치는 클라우드 Gemini 스케줄러가 전담)
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'remoSourcingRun') {
      try { ScriptApp.deleteTrigger(t); } catch(e) {}
    }
  });
  var exDispatch = ScriptApp.getProjectTriggers().filter(function(t){ return t.getHandlerFunction() === 'remoDispatchRun'; });
  if (!exDispatch.length) ScriptApp.newTrigger('remoDispatchRun').timeBased().everyMinutes(5).create();
  return {schedulerActive: true, intervalMinutes: 5, dailyLimit: 50, window: '09:00-20:00 KST'};
}

function remoSendTodayBatchReportNow() {
  var c = remoConnections_(), book = remoBook_(c);
  return remoFlushCycleTelegramReport_(c, book, true);
}

function remoDispatchStartNow() {
  var p = remoEnsureEnv_();
  var c = remoConnections_(), book = remoBook_(c);

  var cleanedRows = remoCleanupPollutedSheetRows_(book);
  var recovered = remoRecoverStuckSending_();
  var start = remoDispatchStart();
  var imported = remoImportReviewedQueue();
  var syncedBodies = remoSyncDraftBodies_(c, book);
  var inboundResult = remoRun();
  var dispatch = remoDispatchRun();

  var result = {
    runnerAccount: c.runnerEmail,
    role: c.isWorkspaceSender ? 'WORKSPACE_SENDER (실제 발송 및 웰컴응대 계정)' : 'STAGING_SYNC_ONLY (초안 동기화 전용)',
    cleanedSystemRows: cleanedRows,
    recoveredBouncedRows: recovered,
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
 * 7. 테스트 전용: 시트 DraftBodies에 적재된 최신 리서치 제안서를 gitkaiba@gmail.com 으로 발송 검증
 * ========================================================================== */

function remoSendTestToGitkaiba() {
  var c = remoConnections_(), book = remoBook_(c);
  var targetEmail = 'gitkaiba@gmail.com';
  var bSheet = remoSheet_(book, 'DraftBodies', REMO_BODY_HEADERS);
  var bRows = remoRows_(bSheet);
  if (!bRows.length) throw new Error('NO_DRAFT_BODIES_IN_SHEET');

  // 시트 DraftBodies의 가장 최신 리서치 제안서(마지막 행)를 가져와 gitkaiba@gmail.com으로 발송 테스트
  var lastRow = bRows[bRows.length - 1];
  var draftId = String(lastRow[0] || 'TEST_DRAFT').replace(/^'+/, '').trim();
  var origEmail = String(lastRow[1] || '').trim();
  var subj = String(lastRow[2] || '').replace(/^'+/, '').trim();
  var dig = String(lastRow[3] || '').trim();
  var html = remoSanitizeEmailHtmlLinks_(String(lastRow[4] || ''));

  var draftObj = {id: draftId, subject: subj, digest: dig, body: html, htmlBody: html};
  var msg = remoMessage_([draftId, targetEmail, origEmail], draftObj, c);
  var at = new Date().toISOString();
  var res = Gmail.Users.Messages.send({raw: msg.raw}, 'me');

  var tgReport = [
    '🧪 [REMO 시트 DraftBodies 제안서 테스트 발송 완료]',
    '• 수신자: ' + targetEmail + ' (원본 타겟: ' + origEmail + ')',
    '• 발신자: ' + c.account + ' (' + c.runnerEmail + ')',
    '• 제목: ' + subj,
    '• Gmail ID: ' + res.id,
    '• 시각: ' + remoFormatCycleTime_(at)
  ].join('\n');

  var tgId = 'SHEET_ONLY';
  try {
    var tgRes = remoTelegram_(c, 'sendMessage', {
      chat_id: c.chat,
      text: tgReport,
      disable_web_page_preview: true
    });
    tgId = String((tgRes && tgRes.message_id) || 'SENT');
  } catch(te) {}

  var events = remoSheet_(book, 'Events', REMO_HEADERS);
  events.appendRow([
    res.id,
    'TEST_SEND',
    targetEmail,
    remoCell_('TEST (' + origEmail + ')'),
    remoCell_(subj),
    at,
    'DraftBodies 시트 원장 기준 테스트 발송 완료',
    'SENT',
    tgId,
    ''
  ]);
  SpreadsheetApp.flush();
  return {status: 'SUCCESS', targetEmail: targetEmail, originalTarget: origEmail, subject: subj, gmailId: res.id};
}


/* ==========================================================================
 * 8. 첫 리드 발송 기본 HTML 골격 (변수 치환용) & Firebase DB (관리자페이지) 실시간 동기화
 * ========================================================================== */

var REMO_OUTBOUND_HTML_SKELETON_ZH = [
  '<div style="font-family:\'PingFang SC\',\'Microsoft YaHei\',Arial,sans-serif;max-width:680px;margin:0 auto;border:1px solid #d9e2ec;border-radius:8px;overflow:hidden;background:#ffffff;color:#1f2933;">',
  '  <div style="background:#16364d;padding:28px 32px;color:#ffffff;">',
  '    <div style="font-size:12px;letter-spacing:1.5px;color:#7cc4fa;font-weight:700;margin-bottom:8px;">ASIA PHYSICAL AI COMMERCIAL NETWORK · REMO</div>',
  '    <div style="font-size:21px;font-weight:700;line-height:1.4;">赋能 {{company}} ({{heroProducts}})：具身智能真机/3D合成数据闭环与韩国·亚太商业化落地提案</div>',
  '  </div>',
  '  <div style="padding:28px 32px;font-size:15px;line-height:1.75;">',
  '    <p style="margin-top:0;">尊敬的 <strong><a href="{{websiteUrl}}" style="color:#16364d;text-decoration:underline;">{{company}}</a></strong> {{recipientRole}}：</p>',
  '    <p>您好！我们深度关注贵司在 <strong>{{heroProducts}}</strong> 领域的技术突破与商业化进程。作为连接中韩及亚太的跨国物理 AI 解决方案伙伴，<strong>REMO (Asia Physical AI Commercial Network)</strong> 希望能针对贵司当前在具身数据训练与海外渠道拓展上的核心痛点提供精准支持。</p>',
  '    <div style="background:#f4f7fa;border-left:4px solid #16364d;padding:18px 22px;margin:20px 0;border-radius:4px;">',
  '      <div style="font-weight:700;color:#16364d;font-size:16px;margin-bottom:10px;">[{{company}} × REMO 定制协同核心要点 3 项]</div>',
  '      <ul style="margin:0;padding-left:20px;">',
  '        <li style="margin-bottom:8px;">{{synergyPoint1}}</li>',
  '        <li style="margin-bottom:8px;">{{synergyPoint2}}</li>',
  '        <li style="margin-bottom:0;">{{synergyPoint3}}</li>',
  '      </ul>',
  '    </div>',
  '    <div style="background:#fffbeb;border:1px solid #f59e0b;border-left:4px solid #d97706;padding:18px 22px;margin:20px 0;border-radius:6px;">',
  '      <div style="font-weight:700;color:#92400e;font-size:15.5px;margin-bottom:10px;">💡 [作为跨国解决方案伙伴，我们想向贵司请教 3 个精准问题]</div>',
  '      <p style="margin:6px 0;font-size:14px;color:#451a03;"><strong>Q1（数据与算法痛点）：</strong>{{diagnosticQuestion1}}</p>',
  '      <p style="margin:6px 0;font-size:14px;color:#451a03;"><strong>Q2（软硬一体与工程化）：</strong>{{diagnosticQuestion2}}</p>',
  '      <p style="margin:6px 0;font-size:14px;color:#451a03;"><strong>Q3（韩国与亚太出海落地）：</strong>{{diagnosticQuestion3}}</p>',
  '    </div>',
  '    <div style="background:#f9fafb;border:1px solid #e2e8f0;padding:18px 22px;margin:20px 0;border-radius:6px;">',
  '      <div style="font-weight:700;color:#16364d;font-size:16px;margin-bottom:10px;">[3 大合作推进轨道]</div>',
  '      <p style="margin:6px 0;"><strong>· Track A（具身真机遥操作 + REMO 3D 合成数据集定制）：</strong>原生支持 RLDS / LeRobot / HDF5 / Isaac Sim。</p>',
  '      <p style="margin:6px 0;"><strong>· Track B（韩国/亚太总代分销、付费 PoC 与本地 SI 运维）：</strong>对接韩国智能制造、物流与顶尖高校实验室。</p>',
  '      <p style="margin:6px 0;"><strong>· Track C（11月26日–29日 深圳高交会 CHTF 期间 1:1 现场会面）：</strong>欢迎提前通过 <strong>微信 (WeChat) 或领英 (LinkedIn)</strong> 联系我们锁定面谈。</p>',
  '    </div>',
  '    <p>您无需撰写长篇回复——只需直接回复邮件至 <a href="mailto:{{senderEmail}}" style="color:#16364d;font-weight:700;">{{senderEmail}}</a> 告知 <strong>您最关注的题号（Q1 / Q2 / Q3）及您的微信号或 LinkedIn</strong>，我们将针对贵司痛点准备好专属解决方案与 1 页简报，于 <strong>11/26–29 深圳现场</strong> 与您深入对接！</p>',
  '    <div style="text-align:center;margin:26px 0 12px 0;">',
  '      <a href="{{landingUrl}}" style="display:inline-block;background:#16364d;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:6px;font-weight:700;margin:6px;">查看1页合作简报与数据样本</a>',
  '      <a href="{{landingUrl}}" style="display:inline-block;background:#fee500;color:#16364d;text-decoration:none;padding:13px 24px;border-radius:6px;font-weight:700;margin:6px;">感兴趣 · 预约11/26-29深圳会面</a>',
  '    </div>',
  '    <p style="font-size:12px;color:#64748b;text-align:center;margin-top:16px;">REMO Global Physical AI Team | Direct: <a href="mailto:{{senderEmail}}" style="color:#64748b;">{{senderEmail}}</a> | Web: <a href="{{landingUrl}}" style="color:#64748b;">remob2blead.vercel.app</a></p>',
  '  </div>',
  '</div>'
].join('\n');

var REMO_OUTBOUND_HTML_SKELETON_EN = [
  '<div style="font-family:\'Inter\',\'Segoe UI\',Arial,sans-serif;max-width:680px;margin:0 auto;border:1px solid #d9e2ec;border-radius:8px;overflow:hidden;background:#ffffff;color:#1f2933;">',
  '  <div style="background:#16364d;padding:28px 32px;color:#ffffff;">',
  '    <div style="font-size:12px;letter-spacing:1.5px;color:#7cc4fa;font-weight:700;margin-bottom:8px;">ASIA PHYSICAL AI COMMERCIAL NETWORK · REMO</div>',
  '    <div style="font-size:21px;font-weight:700;line-height:1.4;">Scaling {{company}}\'s {{heroProducts}} Across APAC with REMO 3D Physical AI Datasets &amp; Enterprise SI</div>',
  '  </div>',
  '  <div style="padding:28px 32px;font-size:15px;line-height:1.75;">',
  '    <p style="margin-top:0;">Dear {{recipientRole}} at <strong><a href="{{websiteUrl}}" style="color:#16364d;text-decoration:underline;">{{company}}</a></strong>,</p>',
  '    <p>We have been closely following {{company}}\'s deployments with <strong>{{heroProducts}}</strong>. As a cross-border Physical AI solution partner across Korea, China, and Singapore/APAC, <strong>REMO</strong> helps robotics leaders solve both perception/manipulation data bottlenecks and overseas enterprise deployment challenges.</p>',
  '    <div style="background:#f4f7fa;border-left:4px solid #16364d;padding:18px 22px;margin:20px 0;border-radius:4px;">',
  '      <div style="font-weight:700;color:#16364d;font-size:16px;margin-bottom:10px;">[{{company}} × REMO: 3 Tailored Synergy Pillars]</div>',
  '      <ul style="margin:0;padding-left:20px;">',
  '        <li style="margin-bottom:8px;">{{synergyPoint1}}</li>',
  '        <li style="margin-bottom:8px;">{{synergyPoint2}}</li>',
  '        <li style="margin-bottom:0;">{{synergyPoint3}}</li>',
  '      </ul>',
  '    </div>',
  '    <div style="background:#fffbeb;border:1px solid #f59e0b;border-left:4px solid #d97706;padding:18px 22px;margin:20px 0;border-radius:6px;">',
  '      <div style="font-weight:700;color:#92400e;font-size:15.5px;margin-bottom:10px;">💡 [3 Quick Diagnostic Questions to Tailor Our Solution for {{company}}]</div>',
  '      <p style="margin:6px 0;font-size:14px;color:#451a03;"><strong>Q1 (Data &amp; Perception Priority):</strong> {{diagnosticQuestion1}}</p>',
  '      <p style="margin:6px 0;font-size:14px;color:#451a03;"><strong>Q2 (Korea &amp; APAC Expansion):</strong> {{diagnosticQuestion2}}</p>',
  '      <p style="margin:6px 0;font-size:14px;color:#451a03;"><strong>Q3 (Cross-Border SI &amp; Bundling):</strong> {{diagnosticQuestion3}}</p>',
  '    </div>',
  '    <div style="background:#f9fafb;border:1px solid #e2e8f0;padding:18px 22px;margin:20px 0;border-radius:6px;">',
  '      <div style="font-weight:700;color:#16364d;font-size:16px;margin-bottom:10px;">[3 Collaboration Tracks]</div>',
  '      <p style="margin:6px 0;"><strong>· Track A (Real-World Teleop &amp; REMO 3D Synthetic Datasets):</strong> Delivered in RLDS / LeRobot / HDF5 / ROS2 formats.</p>',
  '      <p style="margin:6px 0;"><strong>· Track B (Korea &amp; APAC Enterprise Distribution, Paid PoC &amp; Local SI):</strong> Direct access to Korean smart factories, logistics hubs &amp; research labs.</p>',
  '      <p style="margin:6px 0;"><strong>· Track C (Nov 26–29, 2026 Shenzhen CHTF 1:1 On-Site or Virtual Briefing):</strong> Connect with us in advance via <strong>LinkedIn or WeChat</strong>.</p>',
  '    </div>',
  '    <p>Simply reply to <a href="mailto:{{senderEmail}}" style="color:#16364d;font-weight:700;">{{senderEmail}}</a> with your priority numbers (e.g., <strong>Q1 + Q2</strong>) and your <strong>LinkedIn or WeChat ID</strong>, and we will prepare a custom 1-page solution brief for your team.</p>',
  '    <div style="text-align:center;margin:26px 0 12px 0;">',
  '      <a href="{{landingUrl}}" style="display:inline-block;background:#16364d;color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:6px;font-weight:700;margin:6px;">View 1-Page Brief &amp; Data Specs</a>',
  '      <a href="{{landingUrl}}" style="display:inline-block;background:#fee500;color:#16364d;text-decoration:none;padding:13px 24px;border-radius:6px;font-weight:700;margin:6px;">Request a Meeting (LinkedIn / WeChat)</a>',
  '    </div>',
  '  </div>',
  '</div>'
].join('\n');

function remoSyncToFirebaseAdmin_(c, book) {
  if (!book) return {synced: false, reason: 'NO_BOOK'};
  var webhookUrl = (c && c.p && c.p.getProperty('ADMIN_SYNC_WEBHOOK_URL')) || 'https://remob2blead.vercel.app/api/admin/outbound-sync';
  var syncSecret = (c && c.p && c.p.getProperty('ADMIN_SYNC_SECRET')) || '';

  var qSheet = remoSheet_(book, 'Queue', REMO_QUEUE_HEADERS);
  var bSheet = remoSheet_(book, 'DraftBodies', REMO_BODY_HEADERS);
  var sSheet = book.getSheetByName('SourcingPool');

  var qRows = remoRows_(qSheet);
  var bRows = remoRows_(bSheet);
  var sRows = sSheet ? remoRows_(sSheet) : [];

  var bodyByDraftId = {}, bodyByEmail = {};
  bRows.forEach(function(r) {
    var dId = String(r[0] || '').replace(/^'+/, '').trim();
    var em = String(r[1] || '').toLowerCase().trim();
    var item = {
      draftId: dId,
      email: em,
      subject: String(r[2] || '').replace(/^'+/, ''),
      digest: String(r[3] || ''),
      htmlBody: String(r[4] || ''),
      syncedAt: String(r[5] || '')
    };
    if (dId) bodyByDraftId[dId] = item;
    if (em) bodyByEmail[em] = item;
  });

  var metaByEmail = {};
  sRows.forEach(function(r) {
    var em = String(r[6] || '').toLowerCase().trim();
    if (em) {
      metaByEmail[em] = {
        companyId: String(r[0] || ''),
        companyZh: String(r[1] || ''),
        companyEn: String(r[2] || ''),
        category: String(r[3] || ''),
        city: String(r[4] || ''),
        website: String(r[5] || ''),
        wechatOrPhone: String(r[7] || ''),
        signalType: String(r[8] || ''),
        offerTrack: String(r[9] || ''),
        fitScore: Number(r[10] || 0),
        productKeywords: String(r[11] || ''),
        evidenceSummary: String(r[12] || '')
      };
    }
  });

  var outboundItems = qRows.map(function(r) {
    var dId = String(r[0] || '').replace(/^'+/, '').trim();
    var em = String(r[1] || '').toLowerCase().trim();
    var bodyObj = bodyByDraftId[dId] || bodyByEmail[em] || {};
    var metaObj = metaByEmail[em] || {};
    return {
      draftId: dId,
      email: em,
      company: String(r[2] || '').replace(/^'+/, ''),
      sourceUrl: String(r[3] || ''),
      reviewedAt: String(r[4] || ''),
      reviewer: String(r[5] || ''),
      approvalRef: String(r[6] || ''),
      digest: String(r[7] || ''),
      status: String(r[8] || 'READY'),
      sentAt: String(r[9] || ''),
      gmailId: String(r[10] || ''),
      threadId: String(r[11] || ''),
      errorCode: String(r[12] || ''),
      subject: bodyObj.subject || '',
      htmlBody: bodyObj.htmlBody || '',
      city: metaObj.city || '',
      category: metaObj.category || '',
      fitScore: metaObj.fitScore || 95,
      productKeywords: metaObj.productKeywords || '',
      evidenceSummary: metaObj.evidenceSummary || ''
    };
  });

  var payload = {
    syncedAt: new Date().toISOString(),
    sheetId: c.book,
    templates: {
      outboundSkeletonZh: REMO_OUTBOUND_HTML_SKELETON_ZH,
      outboundSkeletonEn: REMO_OUTBOUND_HTML_SKELETON_EN,
      welcomeReplySkeletonZh: REMO_WELCOME_HTML_TEMPLATE
    },
    items: outboundItems
  };

  try {
    var headers = {};
    if (syncSecret) headers['x-remo-sync-secret'] = syncSecret;
    var res = UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    return {synced: res.getResponseCode() >= 200 && res.getResponseCode() < 300, statusCode: res.getResponseCode(), count: outboundItems.length};
  } catch (e) {
    return {synced: false, error: String(e.message || e), count: outboundItems.length};
  }
}
