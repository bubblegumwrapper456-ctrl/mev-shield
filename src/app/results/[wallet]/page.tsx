import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResultsClient } from './ResultsClient';

interface Props {
  params: { wallet: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { wallet } = params;
  const shortWallet = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

  return {
    title: `MEV Shield - Results for ${shortWallet}`,
    description: `Sandwich attack analysis for Solana wallet ${shortWallet}`,
    openGraph: {
      title: `MEV Shield - Sandwich Attack Report`,
      description: `See how many sandwich attacks hit wallet ${shortWallet} on Solana`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `MEV Shield - Sandwich Attack Report`,
      description: `See how many sandwich attacks hit wallet ${shortWallet} on Solana`,
    },
  };
}

export default function ResultsPage({ params }: Props) {
  const { wallet } = params;

  // Basic validation
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  if (!base58Regex.test(wallet)) {
    notFound();
  }

  return <ResultsClient wallet={wallet} />;
}
