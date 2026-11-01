'use client';
import { useTranslation } from '@/components/i18n/LocaleProvider';

import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

export function StickyCTA() { const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [isFormInView, setIsFormInView] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    handleScroll();

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFormInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const formEl = document.getElementById('lead-form');
    if (formEl) observer.observe(formEl);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  if (!visible || isFormInView) return null;

  return (
    <div className="space-sticky-cta fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-text-primary/10 bg-bg-warm/95 backdrop-blur-md p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <button
        onClick={() => {
          trackEvent('sticky_cta_click');
          document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' });
        }}
        className="w-full rounded-2xl bg-billy-yellow py-4 text-[17px] font-bold text-text-primary
                   shadow-xl shadow-billy-yellow/30 active:scale-[0.98] transition-all"
      >
        {t("预约深圳会面")}</button>
    </div>
  );
}

