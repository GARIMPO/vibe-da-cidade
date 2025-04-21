
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import BarList from '@/components/BarList';
import EventSection from '@/components/EventSection';
import Footer from '@/components/Footer';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <BarList />
        <EventSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
