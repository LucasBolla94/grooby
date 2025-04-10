'use client';

import { motion, useAnimationControls } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const controls = useAnimationControls();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const sequence = async () => {
      await controls.start({
        y: [-200, 20, -10, 0],
        rotate: [-20, 15, -10, 0],
        transition: { duration: 1, ease: 'easeOut' },
      });

      await controls.start({
        rotate: [2, -2, 2, -2, 0],
        transition: { repeat: Infinity, duration: 0.6, ease: 'easeInOut' },
      });
    };

    sequence();

    const timeout = setTimeout(() => {
      setShowLogin(true);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [controls]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      
      {/* Fundo */}
      <Image
        src="/bg.png"
        alt="Background"
        fill
        className="object-cover z-0"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Conteúdo */}
      <div className="relative z-20 flex flex-col items-center justify-center h-screen p-4 text-white text-center">

        {/* Logo */}
        <motion.div animate={controls} className="w-full max-w-[80%] sm:max-w-[260px]">
          <Image
            src="/logo.png"
            alt="Grooby Logo"
            width={260}
            height={260}
            priority
            className="w-full h-auto drop-shadow-[0_0_18px_rgba(255,255,255,0.4)] mx-auto"
          />
        </motion.div>

        {/* Botão de login */}
        {showLogin && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            onClick={() => router.push('/auth')}
            className="mt-6 mb-4 px-5 py-3 w-full max-w-[280px] rounded-full bg-gradient-to-r from-white/20 to-white/10 border border-white/30 text-white text-base font-semibold shadow-md hover:scale-105 transition-all duration-300 backdrop-blur-lg"
          >
            Enter Grooby
          </motion.button>
        )}

        {/* Painel de descrição */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="w-full max-w-xl bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg px-5 py-6 sm:px-6 sm:py-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome to Grooby</h1>
          <p className="mt-4 text-base sm:text-lg text-white/80">
            Our mission is to help self-employed professionals take full control of their daily finances, empowering them to grow with clarity and confidence.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
