import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lab Monitor | BioNova',
  description: 'Track Lab Experiments & Equipment Status in Real-Time for Enhanced Operational Oversight.',
};

export default function LabMonitorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add any lab monitor specific providers/context here
  
  return (
    <>
      {children}
    </>
  );
} 