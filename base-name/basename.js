// Import necessary libraries and hooks from Privy and ethers
import { useWallets, usePrivy, usePrivyWallet, useFundWallet } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { useOrgWallet } from './org.js';
import React, { useState, useEffect } from 'react';
import { base } from 'viem/chains';

// Define contract addresses and regular expression for Base names
const BaseNamesRegistrarControllerAddress = "0x4cCb0BB02FCABA27e82a56646E81d8c5bC4119a5";
const L2ResolverAddress = "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD";
const baseNameRegex = /\.base\.eth$/;

// Define ABI for L2 Resolver contract
// This ABI defines the interface for interacting with the L2 Resolver contract
const l2ResolverABI = [
  // Function to set the address for a given node
  {
    inputs: [
      { internalType: "bytes32", name: "node", type: "bytes32" },
      { internalType: "address", name: "a", type: "address" },
    ],
    name: "setAddr",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // Function to set the name for a given node
  {
    inputs: [
      { internalType: "bytes32", name: "node", type: "bytes32" },
      { internalType: "string", name: "newName", type: "string" },
    ],
    name: "setName",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

// Define ABI for Registrar contract
// This ABI defines the interface for interacting with the Registrar contract
const registrarABI = [
  // Function to register a new name
  {
    inputs: [
      {
        components: [
          { internalType: "string", name: "name", type: "string" },
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "uint256", name: "duration", type: "uint256" },
          { internalType: "address", name: "resolver", type: "address" },
          { internalType: "bytes[]", name: "data", type: "bytes[]" },
          { internalType: "bool", name: "reverseRecord", type: "bool" },
        ],
        internalType: "struct RegistrarController.RegisterRequest",
        name: "request",
        type: "tuple",
      },
    ],
    name: "register",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

// Function to create register contract method arguments
// This function prepares the arguments needed to call the register function on the Registrar contract
function createRegisterContractMethodArgs(baseName, addressId) {
  const l2ResolverInterface = new ethers.utils.Interface(l2ResolverABI);
  const node = ethers.utils.namehash(ethers.utils.nameNormalize(baseName));

  const addressData = l2ResolverInterface.encodeFunctionData("setAddr", [node, addressId]);
  const nameData = l2ResolverInterface.encodeFunctionData("setName", [node, baseName]);

  return {
    request: [
      baseName.replace(baseNameRegex, ""),
      addressId,
      "31557600", // Duration in seconds (1 year)
      L2ResolverAddress,
      [addressData, nameData],
      true, // Set reverse record
    ],
  };
}

// Function to register a Base name
async function registerBaseName(userWallet, sendTransaction, baseName, checkWalletBalance, isNigerian, transferFromOrgWallet, fundWallet) {
  try {
    const addressId = userWallet.address;
    const registrationFee = 0.002; // ETH required for registration

    // Check if user needs funds
    const balance = await checkWalletBalance(addressId);
    if (parseFloat(balance.ETH) < registrationFee) {
      const amountToTransfer = registrationFee - parseFloat(balance.ETH);

      if (isNigerian) {
        // Transfer funds from organization wallet if user is Nigerian
        await transferFromOrgWallet(addressId, amountToTransfer);
      } else {
        // Use Privy's funding feature for non-Nigerian users
        await fundWallet(addressId, {
          chain: base,
          amount: amountToTransfer // ETH amount
        });
      }

      // Wait for a short time to allow the transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Prepare registration transaction
    const registerArgs = createRegisterContractMethodArgs(baseName, addressId);
    const registrarInterface = new ethers.utils.Interface(registrarABI);
    const data = registrarInterface.encodeFunctionData("register", [registerArgs]);

    const transactionRequest = {
      to: BaseNamesRegistrarControllerAddress,
      value: ethers.utils.parseEther(registrationFee.toString()),
      data: data,
    };

    // Use Privy's sendTransaction, which should handle gas fees
    const transactionHash = await sendTransaction(transactionRequest);

    console.log(`Transaction sent: ${transactionHash}`);
    console.log(`Base name ${baseName} registration initiated for address: ${addressId}`);

    return transactionHash;
  } catch (error) {
    console.error(`Error registering Base name: ${error.message}`);
    throw error;
  }
}

// Main component for buying a Base name
export function BuyBaseName() {
  const { wallets } = useWallets();
  const { sendTransaction } = usePrivy();
  const { wallet: authenticatedWallet, ready } = usePrivyWallet();
  const { transferFromOrgWallet, checkWalletBalance } = useOrgWallet();
  const { fundWallet } = useFundWallet();
  const [userBalance, setUserBalance] = useState({ ETH: '0', USDC: '0' });
  const [orgBalance, setOrgBalance] = useState({ ETH: '0', USDC: '0' });
  const [isNigerian, setIsNigerian] = useState(false); // Add state for user's nationality

  useEffect(() => {
    const fetchBalances = async () => {
      if (ready && authenticatedWallet) {
        try {
          const userBalances = await checkWalletBalance(authenticatedWallet.address);
          setUserBalance(userBalances);

          const orgBalances = await checkWalletBalance(process.env.REACT_APP_ORG_WALLET_ADDRESS);
          setOrgBalance(orgBalances);
        } catch (error) {
          console.error("Error fetching wallet balances:", error);
        }
      }
    };
    fetchBalances();
  }, [ready, authenticatedWallet, checkWalletBalance]);

  const buyBaseName = async (baseName) => {
    if (!ready) {
      console.error("Wallet not ready");
      return;
    }

    if (!authenticatedWallet) {
      console.error("No authenticated wallet");
      return;
    }

    try {
      const txHash = await registerBaseName(
        authenticatedWallet,
        sendTransaction,
        baseName,
        checkWalletBalance,
        isNigerian,
        transferFromOrgWallet,
        fundWallet
      );
      console.log(`Base name registration transaction hash: ${txHash}`);

      // Refresh balances after transaction
      const updatedUserBalance = await checkWalletBalance(authenticatedWallet.address);
      setUserBalance(updatedUserBalance);
      const updatedOrgBalance = await checkWalletBalance(process.env.REACT_APP_ORG_WALLET_ADDRESS);
      setOrgBalance(updatedOrgBalance);
    } catch (error) {
      console.error("Failed to register Base name:", error);
    }
  };

  return (
    <div>
      <h2>Buy a Base Name</h2>
      <p>Your Wallet Balances:</p>
      <p>ETH: {userBalance.ETH}</p>
      <p>USDC: {userBalance.USDC}</p>
      <p>Organization Wallet Balances:</p>
      <p>ETH: {orgBalance.ETH}</p>
      <p>USDC: {orgBalance.USDC}</p>
      <label>
        Are you Nigerian?
        <input
          type="checkbox"
          checked={isNigerian}
          onChange={(e) => setIsNigerian(e.target.checked)}
        />
      </label>
      <button onClick={() => buyBaseName("example.base.eth")} disabled={!ready || !authenticatedWallet}>
        Buy "example.base.eth"
      </button>
    </div>
  );
}
