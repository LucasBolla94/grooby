'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Plus, LogOut, UserCog } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface UserData {
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  uid: string;
}

interface TokenEntry {
  amount: number;
  price_usd: number;
  date: string;
}

interface TokenData {
  symbol: string;
  name: string;
  price_usd?: number;
  entries: TokenEntry[];
}

async function fetchBinancePrices(symbols: string[]): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price');
    const data = await res.json();
    symbols.forEach((symbol) => {
      const pair = data.find((d: { symbol: string; price: string }) => d.symbol === `${symbol}USDT`);
      if (pair) result[symbol] = parseFloat(pair.price);
    });
  } catch (e) {
    console.error('Erro ao buscar preços da Binance:', e);
  }
  return result;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [exchangeRate] = useState(0.78); // USD to GBP mock

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.replace('/auth');
      const uid = user.uid;

      try {
        const userSnap = await getDoc(doc(db, 'users', uid));
        if (userSnap.exists()) setUserData(userSnap.data() as UserData);

        const walletSnap = await getDoc(doc(db, 'wallets', uid));
        if (walletSnap.exists()) {
          const walletTokens = walletSnap.data().tokens || [];
          const symbols = walletTokens.map((t: TokenData) => t.symbol);
          const prices = await fetchBinancePrices(symbols);

          const updatedTokens = walletTokens.map((t: TokenData) => ({
            ...t,
            price_usd: prices[t.symbol] || 0,
          }));
          setTokens(updatedTokens);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const calculatePortfolio = () => {
    let totalInvestedUSD = 0;
    let totalCurrentUSD = 0;

    tokens.forEach((token) => {
      const totalAmount = token.entries.reduce((sum, entry) => sum + entry.amount, 0);
      const investedUSD = token.entries.reduce(
        (sum, entry) => sum + entry.amount * entry.price_usd,
        0
      );
      const currentPriceUSD = token.price_usd || 0;
      const currentValueUSD = totalAmount * currentPriceUSD;

      totalInvestedUSD += investedUSD;
      totalCurrentUSD += currentValueUSD;
    });

    const investedGBP = totalInvestedUSD * exchangeRate;
    const currentGBP = totalCurrentUSD * exchangeRate;
    const profit = currentGBP - investedGBP;
    const profitPercent = investedGBP > 0 ? (profit / investedGBP) * 100 : 0;

    return { investedGBP, currentGBP, profit, profitPercent };
  };

  const { investedGBP, currentGBP, profit, profitPercent } = calculatePortfolio();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <Image
          src="/logo.png"
          alt="Grooby Logo"
          width={120}
          height={120}
          priority
          className="animate-pulse drop-shadow-[0_0_18px_rgba(255,255,255,0.4)] mb-4"
        />
        <p className="text-lg font-bold animate-pulse text-white/80">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-900 text-white px-4 py-4">
      <Image
        src="/bg.png"
        alt="Background"
        fill
        className="object-cover opacity-30 absolute z-0"
        priority
      />
      <div className="relative z-10">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Grooby"
              width={40}
              height={40}
              className="drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
              priority
            />
            <span className="font-semibold text-lg">Olá, {userData?.name || 'Usuário'}</span>
          </div>
          <div className="flex items-center gap-4">
            <UserCog
              className="w-6 h-6 text-white/70 cursor-pointer"
              onClick={() => router.push('/dash/settings')}
            />
            <LogOut
              className="w-6 h-6 text-white/70 cursor-pointer"
              onClick={async () => {
                await auth.signOut();
                router.push('/auth');
              }}
            />
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl shadow">
            <p className="text-sm text-white/70">Total Investido</p>
            <h2 className="text-2xl font-bold text-blue-400">£{investedGBP.toFixed(2)}</h2>
          </div>
          <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl shadow">
            <p className="text-sm text-white/70">Valor Atual</p>
            <h2 className="text-xl font-semibold text-green-400">£{currentGBP.toFixed(2)}</h2>
          </div>
          <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl shadow">
            <p className="text-sm text-white/70">Lucro / Prejuízo</p>
            <h2
              className={`text-xl font-semibold ${
                profit >= 0 ? 'text-green-300' : 'text-red-300'
              }`}
            >
              {profit >= 0 ? '+' : ''}£{profit.toFixed(2)} ({profitPercent.toFixed(1)}%)
            </h2>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-2">Portfólio</h3>
          <div className="space-y-3">
            {tokens.map((token, index) => {
              const totalAmount = token.entries.reduce((sum, entry) => sum + entry.amount, 0);
              const investedUSD = token.entries.reduce(
                (sum, entry) => sum + entry.amount * entry.price_usd,
                0
              );
              const priceUSD = token.price_usd || 0;
              const currentValueUSD = totalAmount * priceUSD;
              const currentValueGBP = currentValueUSD * exchangeRate;
              const investedGBP = investedUSD * exchangeRate;
              const profitGBP = currentValueGBP - investedGBP;
              const profitPercent = investedGBP > 0 ? (profitGBP / investedGBP) * 100 : 0;

              return (
                <motion.div
                  key={token.symbol}
                  initial={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition cursor-pointer"
                  onClick={() => router.push(`/dash/token/${token.symbol.toUpperCase()}`)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-lg font-bold">
                      {token.name}{' '}
                      <span className="text-white/60 text-sm font-normal">
                        ({token.symbol})
                      </span>
                    </p>
                    <span
                      className={`font-bold text-sm ${
                        profitGBP >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {profitGBP >= 0 ? '+' : ''}£{profitGBP.toFixed(2)} (
                      {profitPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-white/80">
                    <span>
                      Qtd: <span className="font-bold text-white">{totalAmount}</span>
                    </span>
                    <span className="text-base">
                      💲 <span className="font-bold text-white text-lg">${priceUSD.toFixed(2)}</span>
                    </span>
                    <span>
                      Atual £: <span className="font-bold text-white">£{currentValueGBP.toFixed(2)}</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
            {tokens.length === 0 && (
              <p className="text-white/60 text-sm">Nenhum token registrado ainda.</p>
            )}
          </div>
        </section>

        <button
          onClick={() => router.push('/dash/new')}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg flex items-center justify-center text-white text-3xl"
        >
          <Plus size={28} />
        </button>
      </div>
    </div>
  );
}
