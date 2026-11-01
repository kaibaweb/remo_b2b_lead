import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { SocialProof, Opportunities, Audience, CustomProcess, Safety, BrandStory, FinalCTA } from '@/components/landing/RemoSections';
import { ShortsShowcase } from '@/components/landing/ShortsShowcase';
import { LeadForm } from '@/components/landing/LeadForm';
import { StickyCTA } from '@/components/landing/StickyCTA';
import { Footer } from '@/components/landing/Footer';
export default function Home(){return <div className="public-site"><Header/><main className="landing-content flex-1"><Hero/><SocialProof/><Opportunities/><Audience/><CustomProcess/><ShortsShowcase/><Safety/><BrandStory/><FinalCTA/><LeadForm/></main><Footer/><StickyCTA/></div>;}
