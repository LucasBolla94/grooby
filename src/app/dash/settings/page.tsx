'use client';

import Image from 'next/image';

export default function SettingsPage() {
  return (
    <div className="relative min-h-screen bg-gray-900 text-white flex items-center justify-center px-4 py-10">
      <Image
        src="/bg.png"
        alt="Background"
        fill
        className="object-cover opacity-30 absolute z-0"
      />
      <div className="relative z-10 text-center max-w-md">
        <Image
          src="/logo.png"
          alt="Grooby Logo"
          width={80}
          height={80}
          className="mx-auto mb-6 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
        />
        <h1 className="text-3xl font-bold mb-2">Página em Manutenção</h1>
        <p className="text-white/70">Estamos trabalhando nesta funcionalidade. Em breve estará disponível.</p>
      </div>
    </div>
  );
}
