'use client';

import ChainSightWrapper from '@/components/chainSight/ChainSightWrapper';
import { TransactionHistory } from '@/components/chainSight/TransactionHistory';

export default function ChainSightPage() {
  return (
    <ChainSightWrapper>
      <div className="max-w-6xl mx-auto">
        <TransactionHistory showFilters={true} />
      </div>
    </ChainSightWrapper>
  );
} 