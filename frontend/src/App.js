import React from 'react';
import { WagmiProvider, createConfig } from 'wagmi';
import { hardhat } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from '@wagmi/connectors';
import { http } from 'viem';
import LockContract from './components/LockContract';
import './App.css';

const config = createConfig({
  chains: [hardhat],
  connectors: [
    injected()
  ],
  transports: {
    [hardhat.id]: http()
  }
});

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <LockContract />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
