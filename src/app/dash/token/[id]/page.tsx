'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supportedTokens } from '@/data/tokens';

interface TokenEntry {
  type: 'buy' | 'sell';
  amount: number;
  price_usd: number;
  date: string;
}

interface TokenData {
  symbol: string;
  name: string;
  logo: string;
  entries: TokenEntry[];
}

export default function TokenDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const [userId, setUserId] = useState('');
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.replace('/auth');
      setUserId(user.uid);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !id) return;
      const walletRef = doc(db, 'wallets', userId);
      const walletSnap = await getDoc(walletRef);
      if (!walletSnap.exists()) return;

      const walletData = walletSnap.data();
      const tokenData = walletData.tokens.find((t: TokenData) => t.symbol.toUpperCase() === String(id).toUpperCase());

      if (tokenData) {
        const metadata = supportedTokens.find((t) => t.symbol.toUpperCase() === tokenData.symbol.toUpperCase());
        if (metadata) {
          tokenData.name = metadata.name;
          tokenData.logo = metadata.logo;
        }
        setToken(tokenData);
      }
      setLoading(false);
    };

    fetchData();
  }, [userId, id]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const chartData = token?.entries.map((entry) => ({
    date: formatDate(entry.date),
    value: entry.amount * entry.price_usd * (entry.type === 'buy' ? 1 : -1),
  })) || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-6">
      <Image src="/bg.png" alt="bg" fill className="object-cover opacity-20 absolute z-0" />
      <div className="relative z-10 max-w-2xl mx-auto">
        {loading ? (
          <p className="text-center text-white/80">Carregando...</p>
        ) : token ? (
          <>
            <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Image src={`/tokens/${token.logo}`} alt={token.name} width={32} height={32} />
              {token.name} ({token.symbol})
            </h1>

            <div className="bg-white/10 p-4 rounded-xl mb-6">
              <h2 className="text-lg font-semibold mb-2">Gráfico de Transações</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/10 p-4 rounded-xl">
              <h2 className="text-lg font-semibold mb-4">Histórico</h2>
              <ul className="space-y-2">
                {token.entries.map((entry, idx) => (
                  <li key={idx} className="flex justify-between text-sm border-b border-white/10 pb-1">
                    <span>{entry.type === 'buy' ? '🟢 Compra' : '🔴 Venda'}</span>
                    <span>{entry.amount} {token.symbol}</span>
                    <span>${entry.price_usd.toFixed(2)}</span>
                    <span>{formatDate(entry.date)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="text-center text-white/60">Token não encontrado.</p>
        )}
      </div>
    </div>
  );
}