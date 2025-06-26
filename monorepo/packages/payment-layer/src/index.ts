// packages/payment-layer/src/index.ts
import { ethers } from 'ethers';

export interface PaymentConfig {
  x402PayEndpoint?: string;
  cdpWalletConfig: {
    projectId: string;
    privateKey: string;
  };
}

export interface PaymentVerification {
  signature: string;
  amount: string;
  token: string;
}

export interface RevenueSplit {
  recipient: string;
  percentage: number;
}

export class PaymentProcessor {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private x402PayEndpoint: string;

  constructor(config: PaymentConfig) {
    this.provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_KEY'
    );
    this.wallet = new ethers.Wallet(config.cdpWalletConfig.privateKey, this.provider);
    this.x402PayEndpoint = config.x402PayEndpoint || 'https://x402pay.com/api';
  }

  async verifyPayment(payment: PaymentVerification): Promise<boolean> {
    try {
      // Verify x402pay signature
      const response = await fetch(`${this.x402PayEndpoint}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature: payment.signature,
          amount: payment.amount,
          token: payment.token
        })
      });

      const result = await response.json();
      return result.valid === true;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  async distributeRevenue(params: {
    agentId: string;
    totalAmount: string;
    splits: RevenueSplit[];
  }): Promise<void> {
    const { totalAmount, splits } = params;
    const totalAmountWei = ethers.parseEther(totalAmount);

    try {
      // Validate splits add up to 100%
      const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
      if (totalPercentage !== 100) {
        throw new Error('Revenue splits must total 100%');
      }

      // Execute transfers
      for (const split of splits) {
        const amount = (totalAmountWei * BigInt(split.percentage)) / BigInt(100);
        
        const tx = await this.wallet.sendTransaction({
          to: split.recipient,
          value: amount,
          gasLimit: 21000
        });

        console.log(`Revenue split sent: ${split.percentage}% to ${split.recipient}, tx: ${tx.hash}`);
      }
    } catch (error) {
      console.error('Revenue distribution failed:', error);
      throw error;
    }
  }

  async estimateGas(splits: RevenueSplit[]): Promise<string> {
    // Estimate gas for revenue distribution
    const gasPerTransfer = 21000;
    const totalGas = gasPerTransfer * splits.length;
    const gasPrice = await this.provider.getFeeData();
    
    return ethers.formatEther((gasPrice.gasPrice || 0n) * BigInt(totalGas));
  }
}
