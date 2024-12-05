let provider;
let signer;
let contract;
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const contractABI = [
    "function unlockTime() public view returns (uint)",
    "function owner() public view returns (address)",
    "function withdraw() public",
    "constructor(uint _unlockTime) payable",
];

async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            alert('Por favor, instale a MetaMask!');
            return;
        }

        provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);

        document.getElementById('disconnectedState').style.display = 'none';
        document.getElementById('connectedState').style.display = 'block';
        document.getElementById('contractInfo').style.display = 'block';
        document.getElementById('lockForm').style.display = 'block';
        
        updateContractInfo();
    } catch (error) {
        console.error('Erro ao conectar carteira:', error);
        alert('Erro ao conectar carteira');
    }
}

async function disconnectWallet() {
    provider = null;
    signer = null;
    contract = null;
    
    document.getElementById('disconnectedState').style.display = 'block';
    document.getElementById('connectedState').style.display = 'none';
    document.getElementById('contractInfo').style.display = 'none';
    document.getElementById('lockForm').style.display = 'none';
    document.getElementById('withdrawFunds').style.display = 'none';
}

async function updateContractInfo() {
    try {
        const owner = await contract.owner();
        const unlockTime = await contract.unlockTime();
        const date = new Date(unlockTime * 1000);

        document.getElementById('owner').textContent = owner;
        document.getElementById('unlockTime').textContent = date.toLocaleString();

        const currentTime = Math.floor(Date.now() / 1000);
        const isOwner = await signer.getAddress() === owner;
        
        if (isOwner && currentTime >= unlockTime) {
            document.getElementById('withdrawFunds').style.display = 'block';
        } else {
            document.getElementById('withdrawFunds').style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao atualizar informações do contrato:', error);
    }
}

async function lockFunds() {
    try {
        const unlockDate = new Date(document.getElementById('unlockDate').value);
        const amount = ethers.utils.parseEther(document.getElementById('amount').value);
        
        if (unlockDate <= new Date()) {
            alert('A data de desbloqueio deve ser no futuro!');
            return;
        }

        const factory = new ethers.ContractFactory(contractABI, contractBytecode, signer);
        const unlockTime = Math.floor(unlockDate.getTime() / 1000);
        
        const newContract = await factory.deploy(unlockTime, { value: amount });
        await newContract.deployed();
        
        contract = newContract;
        contractAddress = newContract.address;
        
        alert('Fundos bloqueados com sucesso!');
        updateContractInfo();
    } catch (error) {
        console.error('Erro ao bloquear fundos:', error);
        alert('Erro ao bloquear fundos');
    }
}

async function withdrawFunds() {
    try {
        const tx = await contract.withdraw();
        await tx.wait();
        alert('Fundos retirados com sucesso!');
        updateContractInfo();
    } catch (error) {
        console.error('Erro ao retirar fundos:', error);
        alert('Erro ao retirar fundos');
    }
}

document.getElementById('connectWallet').addEventListener('click', connectWallet);
document.getElementById('disconnectWallet').addEventListener('click', disconnectWallet);
document.getElementById('lockFunds').addEventListener('click', lockFunds);
document.getElementById('withdrawFunds').addEventListener('click', withdrawFunds);
