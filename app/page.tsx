'use client'

import Image from 'next/image'


import FacultyInvitationClient from '@/components/FacultyInvitationClient'

export default function Home() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-background">
      {/* Responsive banner — scrolls with the page */}
      <header className="relative h-[clamp(100px,29.3vw,400px)] w-full overflow-hidden bg-white">
        <Image
          src="https://res.cloudinary.com/dmv8mwwe8/image/upload/v1791111741/WhatsApp_Image_2026-10-04_at_16.29.25_gbzbcc.jpg"
          alt="57th MP MEDICON 2026"
          width={1920}
          height={400}
          priority
          unoptimized
          sizes="100vw"
          className="h-full w-full object-contain object-center"
        />
      </header>

      {/* Main content — scrolls naturally */}
      <main className="pb-20">
        <FacultyInvitationClient />
      </main>

      {/* Footer — stays fixed at the bottom */}
      <footer className="fixed inset-x-0 bottom-0 z-50 flex h-14 items-center justify-center border-t bg-sky-100 px-3 sm:px-6 md:h-12">
        <div className="flex w-full flex-col items-center justify-center gap-1 text-center text-xs text-muted-foreground sm:flex-row sm:gap-2 sm:text-sm">
          <span>All Rights Reserved &copy; {currentYear}</span>

          <span className="hidden sm:inline" aria-hidden="true">
            |
          </span>

          <span>
            Developed By{' '}
            <span className="font-semibold text-foreground">
              SaaScraft Studio India Pvt. Ltd.
            </span>
          </span>
        </div>
      </footer>
    </div>
  )
}
