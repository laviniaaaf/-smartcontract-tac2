// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Lock Contract
 * @dev Contrato que permite bloquear ETH por um período determinado
 */
contract Lock {
    uint public unlockTime;
    address payable public owner;
    bool public isLocked;

    event Withdrawal(uint amount, uint when);
    event Deposit(address indexed from, uint amount, uint unlockTime);
    event LockCreated(address indexed owner, uint amount, uint unlockTime);

    constructor() {
        owner = payable(msg.sender);
        isLocked = false;
    }

    /**
     * @dev Bloqueia ETH no contrato
     * @param _unlockTime Timestamp Unix para desbloqueio
     */
    function lock(uint _unlockTime) public payable {
        require(!isLocked, "Contrato ja esta bloqueado");
        require(
            block.timestamp < _unlockTime,
            "Tempo de desbloqueio deve ser no futuro"
        );
        require(msg.value > 0, "Deve enviar algum ETH para bloquear");

        unlockTime = _unlockTime;
        owner = payable(msg.sender);
        isLocked = true;

        emit LockCreated(msg.sender, msg.value, _unlockTime);
    }

    /**
     * @dev Retira os fundos bloqueados
     * @notice Apenas o proprietario pode chamar apos o tempo de desbloqueio
     */
    function withdraw() public {
        require(isLocked, "Nenhum fundo bloqueado");
        require(block.timestamp >= unlockTime, "Ainda nao pode retirar");
        require(msg.sender == owner, "Voce nao eh o proprietario");

        uint amount = address(this).balance;
        isLocked = false;

        emit Withdrawal(amount, block.timestamp);
        owner.transfer(amount);
    }

    /**
     * @dev Retorna o saldo atual do contrato
     */
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    /**
     * @dev Verifica se já pode retirar os fundos
     */
    function canWithdraw() public view returns (bool) {
        return isLocked && block.timestamp >= unlockTime && msg.sender == owner;
    }

    /**
     * @dev Retorna o tempo restante em segundos
     */
    function timeLeft() public view returns (uint) {
        if (!isLocked || block.timestamp >= unlockTime) return 0;
        return unlockTime - block.timestamp;
    }
}
