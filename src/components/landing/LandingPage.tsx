import { Header } from './Header';
import { Hero } from './Hero';
import { WhatYouNeed, OurSolutions, WhyRemo, GlobalPresence, ChtfMeeting, FinalBusinessCTA } from './BusinessSections';
import { StickyCTA } from './StickyCTA';
import { Footer } from './Footer';

export default function Home() {
  return <div className="public-site"><Header/><main className="landing-content flex-1">
    <Hero/>
    <WhatYouNeed/>
    <OurSolutions/>
    <WhyRemo/>
    <GlobalPresence/>
    <ChtfMeeting/>
    <FinalBusinessCTA/>
  </main><Footer/><StickyCTA/></div>;
}
