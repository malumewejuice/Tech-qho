import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import ServiceHighlight from '@/components/ServiceHighlight';
import ClientTestimonials from '@/components/ClientTestimonials';
import Footer from '@/components/Footer';
import ChatSupport from '@/components/ChatSupport';

const Index = () => {
  // Removed problematic scroll-to-top behavior

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <ServiceHighlight />
        <ClientTestimonials />
      </main>
      <Footer />
      <ChatSupport />
    </div>
  );
};

export default Index;
