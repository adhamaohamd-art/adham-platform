import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FloatingWhatsApp } from './FloatingWhatsApp';
import { PageFade } from './MotionPrimitives';

export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-gradient p-0 sm:p-4 lg:p-7">
      <div className="mx-auto max-w-[1440px] overflow-x-clip rounded-[24px] border-2 border-[#14202B] bg-brand-gradient shadow-2xl md:rounded-[32px]">
        <Navbar />
        <main>
          <PageFade>{children}</PageFade>
        </main>
        <Footer />
      </div>
      <FloatingWhatsApp />
    </div>
  );
}
