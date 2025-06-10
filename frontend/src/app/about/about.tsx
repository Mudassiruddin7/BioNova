import React from 'react';

export default function AboutPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">About BioNova AI Studio</h1>
      <p className="mb-4">
      BioNova AI Studio is a cutting-edge platform that combines AI, IoT, and blockchain 
        for Gene editing exploration.
      </p>
      <p className="mb-4">
        Our mission is to provide researchers, students, and enthusiasts with tools to visualize 
        and understand gene editing possibilities using the latest technologies.
      </p>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Technologies</h2>
        <ul className="list-disc pl-8 space-y-2">
          <li>Advanced AI for gene editing prediction and optimization</li>
          <li>Blockchain verification for data integrity and sharing</li>
          <li>IoT monitoring for laboratory environments</li>
          <li>Interactive visualization of DNA sequences and edits</li>
        </ul>
      </div>
    </div>
  );
} 