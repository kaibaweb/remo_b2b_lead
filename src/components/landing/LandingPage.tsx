'use client';
import { useState, useSyncExternalStore } from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { MeetingOffers, MeetingRequest } from './BusinessSections';
import { StickyCTA } from './StickyCTA';
import { Footer } from './Footer';
import { meetingInterestFromHref } from '@/lib/business-contact.mjs';

const subscribeLocation=(callback:()=>void)=>{
  window.addEventListener('popstate',callback);
  return ()=>window.removeEventListener('popstate',callback);
};
const readInterest=()=>meetingInterestFromHref(window.location.href);
export default function Home() {
  const initialInterest=useSyncExternalStore(subscribeLocation,readInterest,()=> '');
  const [chosen,setChosen]=useState<string | null>(null);
  const interest=chosen ?? initialInterest;
  return <div className="public-site meeting-site"><Header/><main className="landing-content flex-1">
    <Hero/>
    <MeetingOffers selected={interest} onChoose={setChosen}/>
    <MeetingRequest selected={interest} onChoose={setChosen}/>
  </main><Footer compact/><StickyCTA/></div>;
}
