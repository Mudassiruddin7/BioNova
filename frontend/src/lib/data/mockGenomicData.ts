// Mock genomic data for demonstration purposes
const mockGenomicData = [
  {
    id: "gen-001",
    name: "CRISPR-Cas9 Modification - BRCA1",
    description: "Gene editing experiment targeting BRCA1 gene for cancer resistance",
    date: "2023-10-15T09:30:00Z",
    owner: "0x7823C8b58EAf5b018596fEd144090eB7E8A37ce1",
    status: "completed",
    type: "edit",
    blockchainHash: "0x8f5b018596fEd144090eB7E8A37ce17823C8b58E",
    sequence: "ACGTTGACATTGCAATGAGCTGAATGCCAATCGTAGCGATCGAT",
    results: [
      { key: "Efficiency", value: "87.3%" },
      { key: "Off-target effects", value: "2.1%" },
      { key: "Viability", value: "92.7%" }
    ]
  },
  {
    id: "gen-002",
    name: "Genomic Sequencing - TP53",
    description: "Whole genome sequencing focusing on TP53 tumor suppressor gene",
    date: "2023-11-05T14:45:00Z",
    owner: "0x9A45D8B291783C8b58EAf5b018596fEd144090eB",
    status: "completed",
    type: "sequence",
    blockchainHash: "0x3C8b58EAf5b018596fEd144090eB7E8A37ce1782",
    sequence: "TGAGCTGAATGCCAATCGTAGCGATCGATACGTTGACATTGCAA",
    results: [
      { key: "Coverage", value: "99.2%" },
      { key: "Mutations identified", value: "17" },
      { key: "Pathogenic variants", value: "3" }
    ]
  },
  {
    id: "gen-003",
    name: "mRNA Expression Analysis",
    description: "Analysis of gene expression patterns in response to environmental stress",
    date: "2023-12-01T11:20:00Z",
    owner: "0x7823C8b58EAf5b018596fEd144090eB7E8A37ce1",
    status: "in-progress",
    type: "analysis",
    blockchainHash: "0x596fEd144090eB7E8A37ce17823C8b58EAf5b018",
    sequence: "",
    results: [
      { key: "Differentially expressed genes", value: "843" },
      { key: "Upregulated pathways", value: "12" },
      { key: "Statistical confidence", value: "p<0.001" }
    ]
  },
  {
    id: "gen-004",
    name: "CRISPR Screen - Immunotherapy",
    description: "Genome-wide CRISPR screen for immunotherapy resistance genes",
    date: "2024-01-10T08:15:00Z",
    owner: "0x5b018596fEd144090eB7E8A37ce17823C8b58EAf",
    status: "completed",
    type: "screen",
    blockchainHash: "0xEAf5b018596fEd144090eB7E8A37ce17823C8b58",
    sequence: "TGCAATGAGCTGAATGCCAATCGTAGCGATCGATACGTTGACAT",
    results: [
      { key: "Hits identified", value: "28" },
      { key: "Top gene", value: "PDCD1" },
      { key: "False discovery rate", value: "<0.05" }
    ]
  },
  {
    id: "gen-005",
    name: "Base Editing - HBB",
    description: "Precise base editing of hemoglobin beta gene for sickle cell anemia",
    date: "2024-02-18T13:40:00Z",
    owner: "0x7823C8b58EAf5b018596fEd144090eB7E8A37ce1",
    status: "pending-review",
    type: "edit",
    blockchainHash: "0x090eB7E8A37ce17823C8b58EAf5b018596fEd144",
    sequence: "GACATTGCAATGAGCTGAATGCCAATCGTAGCGATCGATACGTT",
    results: [
      { key: "Editing efficiency", value: "79.5%" },
      { key: "Phenotype correction", value: "68.2%" },
      { key: "Cell viability", value: "91.3%" }
    ]
  }
];

export default mockGenomicData; 