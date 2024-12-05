import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { injected } from '@wagmi/connectors';
import LockABI from '../contracts/Lock.json';
import contractAddress from '../contracts/contract-address.json';

function LockContract() {
  const [unlockTime, setUnlockTime] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  
  // Leitura de dados do contrato
  const { data: owner } = useReadContract({
    address: contractAddress.Lock,
    abi: LockABI.abi,
    functionName: 'owner'
  });

  const { data: isLocked } = useReadContract({
    address: contractAddress.Lock,
    abi: LockABI.abi,
    functionName: 'isLocked'
  });

  const { data: contractBalance } = useReadContract({
    address: contractAddress.Lock,
    abi: LockABI.abi,
    functionName: 'getBalance'
  });

  const { data: timeLeftData } = useReadContract({
    address: contractAddress.Lock,
    abi: LockABI.abi,
    functionName: 'timeLeft'
  });

  const { writeContract, isPending } = useWriteContract();

  const handleConnect = async () => {
    try {
      await connect({ connector: injected() });
      setError('');
    } catch (err) {
      setError('Erro ao conectar: ' + err.message);
    }
  };

  const handleLock = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const timestamp = Math.floor(new Date(unlockTime).getTime() / 1000);
      
      const { hash } = await writeContract({
        address: contractAddress.Lock,
        abi: LockABI.abi,
        functionName: 'lock',
        args: [timestamp],
        value: parseEther(amount)
      });

      setSuccess(' Fundos bloqueados com sucesso! Aguarde a confirmação...');
      setAmount('');
      setUnlockTime('');
    } catch (err) {
      setError(' Erro ao bloquear fundos: ' + err.message);
    }
  };

  const handleWithdraw = async () => {
    setError('');
    setSuccess('');

    try {
      const { hash } = await writeContract({
        address: contractAddress.Lock,
        abi: LockABI.abi,
        functionName: 'withdraw'
      });

      setSuccess(' Retirada iniciada! Aguarde a confirmação...');
    } catch (err) {
      setError(' Erro ao retirar fundos: ' + err.message);
    }
  };

  return (
    <div className="container">
      <h1> Contrato de Bloqueio Temporal</h1>

      <div className="info-box">
        {isConnected ? (
          <>
            <p> Carteira Conectada: {address}</p>
            <button onClick={() => disconnect()} className="disconnect-btn">
              Desconectar
            </button>
          </>
        ) : (
          <button onClick={handleConnect} className="connect-btn">
            Conectar Carteira
          </button>
        )}
      </div>

      {isConnected && (
        <>
          <div className="info-box">
            <h2> Informações do Contrato</h2>
            <p> Proprietário: {owner}</p>
            <p> Saldo: {contractBalance ? formatEther(contractBalance) : '0'} ETH</p>
            <p> Status: {isLocked ? 'Bloqueado' : 'Desbloqueado'}</p>
            {timeLeftData && timeLeftData > 0 && (
              <p> Tempo Restante: {Math.floor(Number(timeLeftData) / 3600)} horas</p>
            )}
          </div>

          <form onSubmit={handleLock} className="lock-form">
            <div className="form-group">
              <label htmlFor="unlockTime"> Tempo de Desbloqueio:</label>
              <input
                type="datetime-local"
                id="unlockTime"
                value={unlockTime}
                onChange={(e) => setUnlockTime(e.target.value)}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount"> Quantidade (ETH):</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isPending || isLocked} 
              className="lock-btn"
            >
              {isPending ? ' Bloqueando...' : ' Bloquear Fundos'}
            </button>
          </form>

          <button 
            onClick={handleWithdraw} 
            disabled={isPending || !isLocked} 
            className="withdraw-btn"
          >
            {isPending ? ' Retirando...' : ' Retirar Fundos'}
          </button>
        </>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
}

export default LockContract;
