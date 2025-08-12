import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import ServiceHighlight from '@/components/ServiceHighlight';
import ClientTestimonials from '@/components/ClientTestimonials';
import Footer from '@/components/Footer';
import ChatSupport from '@/components/ChatSupport';

const Index = () => {
  useEffect(() => {
    const handleClick = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

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
