export async function sendTelegramNotification(payload: {company:string;contactName:string;track:string;leadId:string}) {
  const token=process.env.TELEGRAM_BOT_TOKEN, chat=process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return 'not_configured';
  // Keep business contact details in the authenticated CRM rather than in the notification.
  const response=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chat,text:`REMO 新合作咨询\n公司：${payload.company}\n方向：${payload.track}\n记录：${payload.leadId}`}),signal:AbortSignal.timeout(8000)});
  if(!response.ok || !(await response.json()).ok) throw new Error('Telegram notification failed');
  return 'accepted';
}
