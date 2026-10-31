'use client';

import { useState, useRef, useCallback, useSyncExternalStore } from 'react';
import { Section, SectionHeadline } from '@/components/ui/Section';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';

const subscribeLocation=(callback:()=>void)=>{window.addEventListener('popstate',callback);return()=>window.removeEventListener('popstate',callback);};
const readTrack=()=>{const value=new URLSearchParams(window.location.search).get('track');return value&&['finefit','physical_ai_data','korea_entry'].includes(value)?value:'';};
interface FormErrors {
  [key: string]: string;
}

export function LeadForm() {
  const queryTrack=useSyncExternalStore(subscribeLocation,readTrack,()=> '');
  const [selectedTrack,setSelectedTrack]=useState('');
  const [formData, setFormData] = useState({
    company: '',
    contactName: '',
    phone: '',
    track: 'korea_entry',
    email: '',
    message: '',
    privacyConsent: false,
    honeypot: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const formStarted = useRef(false);


  const handleInputChange = useCallback((field: string, value: string | boolean) => {
    if (!formStarted.current) {
      formStarted.current = true;
      trackEvent('form_start');
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.company.trim()) newErrors.company = '请输入公司或机构名称。';
    else if (formData.company.length > 100) newErrors.company = '请控制在100字以内。';

    if (!formData.contactName.trim()) newErrors.contactName = '请输入联系人。';
    else if (formData.contactName.length > 50) newErrors.contactName = '请控制在50字以内。';

    if (!formData.phone.trim()) newErrors.phone = '请输入电话或微信。';
    else if (!/^[a-zA-Z0-9_+() .-]{5,64}$/.test(formData.phone)) newErrors.phone = '请输入有效的电话或微信（5–64位）。';

    if (!formData.email.trim()) newErrors.email = '请输入邮箱。';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = '请输入有效邮箱。';

    if (!formData.privacyConsent) newErrors.privacyConsent = '请阅读并同意咨询信息处理说明。';

    if (formData.message.length > 1000) newErrors.message = '请控制在1000字以内。';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (formData.honeypot) return;

    if (!validate()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError('');
    trackEvent('form_submit');

    try {
      // Collect UTM params
      const params = new URLSearchParams(window.location.search);

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: formData.company.trim(),
          contactName: formData.contactName.trim(),
          phone: formData.phone.trim(),
          track: selectedTrack || queryTrack || formData.track,
          privacyConsent: formData.privacyConsent,
          email: formData.email.trim(),
          message: formData.message.trim() || undefined,
          source: 'remo-china-landing',
          landingPath: window.location.pathname,
          utmSource: params.get('utm_source') || undefined,
          utmMedium: params.get('utm_medium') || undefined,
          utmCampaign: params.get('utm_campaign') || undefined,
          utmContent: params.get('utm_content') || undefined,
          utmTerm: params.get('utm_term') || undefined,
          referrer: document.referrer || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || '提交失败，请稍后再试。');
      }

      setIsSuccess(true);
      trackEvent('form_success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交失败，请稍后再试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Section bg="yellow" id="lead-form">
        <div role="status" className="max-w-[500px] mx-auto text-center py-12">
          <span className="text-6xl block mb-6">✨</span>
          <h2 className="text-[28px] md:text-[36px] font-extrabold text-text-primary mb-4">
            合作咨询已收到！
          </h2>
          <p className="text-[17px] text-text-secondary leading-relaxed mb-2">
            负责人确认后将与您联系。
          </p>
          <p className="text-[15px] text-text-muted">
            请保留提交信息，方便后续交流。
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section bg="yellow" id="lead-form">
      <SectionHeadline>
        您希望探索
        <br />
        哪一种合作？
      </SectionHeadline>

      <form
        onSubmit={handleSubmit}
        className="max-w-[520px] mx-auto"
        noValidate
      >
        {/* Honeypot - hidden from humans */}
        <div className="absolute opacity-0 pointer-events-none -z-10" aria-hidden="true">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={formData.honeypot}
            onChange={(e) => handleInputChange('honeypot', e.target.value)}
          />
        </div>

        <div className="space-y-5">
          {/* Required fields */}
          <div><label htmlFor="track" className="block text-[15px] font-semibold mb-2">合作方向</label><select id="track" value={selectedTrack || queryTrack || formData.track} onChange={e=>setSelectedTrack(e.target.value)} className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3.5"><option value="finefit">FINEFIT 产品与渠道</option><option value="physical_ai_data">机器人训练数据需求</option><option value="korea_entry">韩国市场与技术合作</option></select></div>
          <Input
            label="公司 / 机构"
            placeholder="例如：机器人研发团队、健身集团"
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            error={errors.company}
            required
          />

          <Input
            label="联系人"
            placeholder="您的姓名"
            value={formData.contactName}
            onChange={(e) => handleInputChange('contactName', e.target.value)}
            error={errors.contactName}
            required
          />

          <Input
            label="电话 / 微信"
            type="tel"
            placeholder="电话或微信号"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            error={errors.phone}
            required
          />

          <Input
            label="邮箱"
            type="email"
            placeholder="example@company.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            required
          />

          <Textarea
            label="需求说明（选填）"
            placeholder="请简述产品、目标市场、数据需求或方便沟通的时间。"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            error={errors.message}
            rows={4}
          />

          {/* Privacy consent */}
          <div className="flex items-start gap-3">
            <input
              id="privacy-consent"
              type="checkbox"
              checked={formData.privacyConsent}
              onChange={(e) => handleInputChange('privacyConsent', e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-billy-yellow focus:ring-billy-yellow accent-billy-yellow cursor-pointer"
            />
            <label htmlFor="privacy-consent" className="text-[14px] text-text-secondary leading-relaxed cursor-pointer">
              为处理本次合作咨询，我已阅读并同意{' '}
              <a href="/privacy" target="_blank" className="text-billy-blue underline hover:text-billy-blue/80">
                咨询信息与隐私说明
              </a>
              。
            </label>
          </div>
          {errors.privacyConsent && (
            <p className="text-[13px] text-accent-red font-medium -mt-3">{errors.privacyConsent}</p>
          )}

          {/* Submit error */}
          {submitError && (
            <div role="alert" className="rounded-xl bg-red-50 border border-accent-red/20 p-4 text-[14px] text-accent-red font-medium">
              {submitError}
            </div>
          )}

          {/* Submit button */}
          <Button
            type="submit"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            className="mt-2"
          >
            {isSubmitting ? '提交中…' : '提交合作需求 →'}
          </Button>
        </div>
      </form>
    </Section>
  );
}

