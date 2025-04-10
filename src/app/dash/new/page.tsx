'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/client';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { supportedTokens } from '@/data/tokens';
import { AnimatePresence, motion } from 'framer-motion';

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

interface WalletData {
  userId: string;
  tokens: TokenData[];
}

export default function NewTokenEntry() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [token, setToken] = useState('');
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [totalSpent, setTotalSpent] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [availableAmount, setAvailableAmount] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.replace('/auth');
      setUserId(user.uid);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const total = parseFloat(totalSpent);
    const price = parseFloat(priceUsd);
    if (type === 'buy') {
      if (!isNaN(total) && !isNaN(price) && price > 0) {
        setAmount((total / price).toFixed(6));
      } else {
        setAmount('');
      }
    }
  }, [totalSpent, priceUsd, type]);

  useEffect(() => {
    const fetchAvailableAmount = async () => {
      if (!userId || !token) {
        setAvailableAmount(null);
        return;
      }

      const walletRef = doc(db, 'wallets', userId);
      const walletSnap = await getDoc(walletRef);
      if (!walletSnap.exists()) {
        setAvailableAmount(null);
        return;
      }

      const walletData = walletSnap.data() as WalletData;
      const tokenData = walletData.tokens.find((t) => t.symbol === token);
      if (!tokenData) {
        setAvailableAmount(null);
        return;
      }

      const totalBought = tokenData.entries.filter((e) => e.type === 'buy').reduce((sum, e) => sum + e.amount, 0);
      const totalSold = tokenData.entries.filter((e) => e.type === 'sell').reduce((sum, e) => sum + e.amount, 0);
      setAvailableAmount(totalBought - totalSold);
    };

    fetchAvailableAmount();
  }, [token, userId]);

  const handleSubmit = async () => {
    if (!token || !amount || !priceUsd || !date) return;
    const amountNum = parseFloat(amount);
    if (type === 'sell' && availableAmount !== null && amountNum > availableAmount) {
      alert(`Você só pode vender até ${availableAmount.toFixed(6)} ${token}`);
      return;
    }

    const tokenInfo = supportedTokens.find((t) => t.symbol === token);
    if (!tokenInfo) {
      alert('Token não suportado. Selecione um token válido.');
      return;
    }

    setIsSubmitting(true);

    try {
      const walletRef = doc(db, 'wallets', userId);
      const walletSnap = await getDoc(walletRef);

      const newEntry: TokenEntry = {
        type,
        amount: amountNum,
        price_usd: parseFloat(priceUsd),
        date,
      };

      let walletData: WalletData = { userId, tokens: [] };

      if (walletSnap.exists()) {
        walletData = walletSnap.data() as WalletData;
        const tokenIndex = walletData.tokens.findIndex((t) => t.symbol === token);

        if (tokenIndex > -1) {
          walletData.tokens[tokenIndex].entries.push(newEntry);
        } else {
          walletData.tokens.push({
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            logo: tokenInfo.logo,
            entries: [newEntry],
          });
        }
      } else {
        walletData.tokens = [
          {
            symbol: tokenInfo.symbol,
            name: tokenInfo.name,
            logo: tokenInfo.logo,
            entries: [newEntry],
          },
        ];
      }

      await setDoc(walletRef, walletData);

      setSuccessMessage(true);
      setTimeout(() => {
        router.push('/dash');
      }, 2000);
    } catch (err) {
      console.error('Erro ao salvar token:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-white px-4 py-6">
      <Image src="/bg.png" alt="Background" fill className="object-cover opacity-30 absolute z-0" />
      <div className="relative z-10 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Nova Transação de Token</h1>

        <label className="block text-sm mb-1">Tipo de Transação</label>
        <select
          className="w-full p-2 rounded bg-white/10 text-white mb-4"
          value={type}
          onChange={(e) => setType(e.target.value as 'buy' | 'sell')}
        >
          <option value="buy">Compra</option>
          <option value="sell">Venda</option>
        </select>

        <label className="block text-sm mb-1">Nome da Moeda (ex: SOL, USDC)</label>
        <input
          list="token-list"
          className="w-full p-2 rounded bg-white/10 text-white mb-4"
          placeholder="SOL"
          value={token}
          onChange={(e) => setToken(e.target.value.toUpperCase())}
        />
        <datalist id="token-list">
          {supportedTokens.map((t) => (
            <option key={t.symbol} value={t.symbol} />
          ))}
        </datalist>

        {type === 'sell' && availableAmount !== null && (
          <div className="text-sm text-white/60 mb-2">
            Disponível para venda: <span className="text-white font-bold">{availableAmount.toFixed(6)} {token}</span>
          </div>
        )}

        <label className="block text-sm mb-1">
          {type === 'buy' ? 'Valor Total Investido (USD)' : 'Quantidade de ' + token + ' Vendida'}
        </label>
        <input
          type="number"
          className="w-full p-2 rounded bg-white/10 text-white mb-4"
          value={totalSpent}
          onChange={(e) => setTotalSpent(e.target.value)}
        />

        <label className="block text-sm mb-1">Preço da Moeda na Hora da {type === 'buy' ? 'Compra' : 'Venda'} (USD)</label>
        <input
          type="number"
          className="w-full p-2 rounded bg-white/10 text-white mb-4"
          value={priceUsd}
          onChange={(e) => setPriceUsd(e.target.value)}
        />

        {amount && type === 'buy' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-sm text-white/80"
          >
            Você comprou aproximadamente <span className="font-bold text-white">{amount}</span> {token}
          </motion.div>
        )}

        <label className="block text-sm mb-1">Data da {type === 'buy' ? 'Compra' : 'Venda'}</label>
        <input
          type="date"
          className="w-full p-2 rounded bg-white/10 text-white mb-6"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Transação'}
        </motion.button>

        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 text-center text-green-400"
            >
              ✅ Transação salva com sucesso!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}