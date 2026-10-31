type AnalyticsEvent =
  | 'page_view'
  | 'hero_cta_click'
  | 'sticky_cta_click'
  | 'case_view'
  | 'use_case_click'
  | 'custom_cta_click'
  | 'form_start'
  | 'form_submit'
  | 'form_success'
  | 'kakao_click'
  | 'phone_click';

interface EventPayload {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Analytics abstraction layer.
 * Replace the console.log with your preferred vendor (GA4, Mixpanel, etc.)
 */
export function trackEvent(event: AnalyticsEvent, payload?: EventPayload): void {
  // Development: log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${event}`, payload ?? '');
  }

  // Production: send to analytics vendor
  // Example for GA4:
  // if (typeof window !== 'undefined' && window.gtag) {
  //   window.gtag('event', event, payload);
  // }
}

