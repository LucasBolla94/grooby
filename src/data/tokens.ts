// src/data/tokens.ts

export interface TokenInfo {
    symbol: string;    // Ex: "SOL"
    name: string;      // Ex: "Solana"
    logo: string;      // Ex: "/tokens/solana.png"
  }
  
  export const supportedTokens: TokenInfo[] = [
    {
      symbol: 'SOL',
      name: 'Solana',
      logo: '/tokens/solana.png',
    },
    {
      symbol: 'USDC',
      name: 'USD Coin',
      logo: '/tokens/usdc.png',
    },
    {
      symbol: 'USDT',
      name: 'Tether',
      logo: '/tokens/usdt.png',
    },
    {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      logo: '/tokens/weth.png',
    },
    // Adicione mais aqui...
  ];
  