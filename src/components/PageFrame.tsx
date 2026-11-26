import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FloatingWhatsApp } from './FloatingWhatsApp';
import { PageFade } from './MotionPrimitives';

export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-gradient p-0 sm:p-4 lg:p-7">
      <div className="mx-auto max-w-[1440px] overflow-x-clip rounded-none border-0 border-[#14202B] bg-brand-gradient shadow-2xl sm:rounded-[24px] sm:border-2 md:rounded-[32px]">
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
