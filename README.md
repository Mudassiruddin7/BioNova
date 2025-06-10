# BioNova AI Studio

## 🚀 Project Title
Empowering Precision Gene Editing with AI 🤖, IoT 🌐, and Blockchain 🔗 – All in One Platform 💻✨

## 🎯 Objective
BioNova addresses critical challenges in CRISPR-based gene editing—specifically, the difficulty in designing effective guide RNAs, the sensitivity of experiments to lab conditions, and the need for secure, traceable data management. Our objective is to empower researchers, biotech professionals, and students with an integrated platform that significantly enhances the efficiency, reliability, and trustworthiness of gene editing workflows. 

By combining AI-powered prediction (a fine-tuned DNABERT model accelerated by Groq) for optimal guide RNA design, real-time IoT sensors for meticulous lab environment monitoring, and the Base blockchain for immutable data provenance and secure workflow automation, BioNova aims to: 
- Increase the precision and success rate of gene edits while minimizing off-target effects.
- Improve experimental reproducibility by ensuring optimal and consistent lab conditions.
- Guarantee data integrity and provide a transparent, auditable trail for genomic data and experimental outcomes.
- Accelerate the overall research lifecycle through AI-driven insights and streamlined processes.

## 🧠 Approach

**Our Approach:**  
Recognizing the significant hurdles in modern gene editing—precise guide RNA design, maintaining optimal lab conditions, and ensuring data integrity—we set out to build BioNova. Our core strategy was to synergistically combine specialized AI, real-time IoT monitoring, and the transparency of blockchain.

This involved several distinct technical pillars and their associated challenges:

1.  **AI-Powered Prediction (DNABERT & Groq):** We aimed to leverage a fine-tuned DNABERT model for accurate guide RNA prediction. The primary challenge (`Model Fine-Tuning`) involved extensive experimentation with tokenization, embedding strategies, and iterative optimization to ensure biological relevance and computational efficiency. Integrating Groq for rapid inference (`Groq Integration`) further required careful prompt engineering, model selection (balancing speed and accuracy on LPUs), especially for real-time tasks like interpreting lab commands or explaining blockchain events.

2.  **IoT-Driven Lab Monitoring:** To address experimental sensitivity, we integrated real-time environmental sensors. The `IoT Integration` challenge lay in establishing reliable data synchronization between sensors and our backend, tackling potential latency and connectivity issues to ensure continuous, accurate monitoring crucial for reproducibility.

3.  **Blockchain for Trust (Base):** We utilized the Base blockchain for secure data management. The `Blockchain Deployment` phase involved designing robust smart contracts for complex tasks like sample provenance tracking, immutable audit trails, granular access control, and workflow automation. Ensuring the correctness, security, and efficiency of these contracts required meticulous planning and testing.

4.  **System Cohesion:** The overarching `System Integration` challenge was merging these disparate technologies (Python ML, Node.js backend, Next.js frontend, IoT streams, Blockchain interactions, Groq APIs) into a seamless platform. This demanded careful orchestration, robust inter-process communication strategies (like the FastAPI bridge), and rigorous debugging to ensure smooth interaction between components.

Our development process was inherently iterative. We refined the user interface based on early feedback, addressed model latency through targeted optimizations in the Python environment and data serialization, and proactively built comprehensive backend error handling to manage the complexity of the integrated system.

## 🛠️ Tech Stack
**Core Technologies Used:**
- **Frontend:** Next.js 14 (App Router), React 19, TypeScript, Tailwind CSS, Shadcn/ui, Zustand/Jotai, Socket.IO Client, Recharts, Framer Motion  
- **Backend:** Node.js, Express, TypeScript, Mongoose (MongoDB ODM), JWT Authentication, Groq SDK, FastAPI (Python bridge)  
- **Python / Gene Predictor:** Python 3.12.3, FastAPI, DNABERT model, torch, transformers, einops, accelerate , triton
- **Database:** MongoDB (local or Atlas)  
- **APIs:** REST endpoints under `/api`, Groq AI Chat & Image Generation
- **CI/CD:** GitLab for automated testing and deployment workflows  
- **Hosting:** Vercel (Frontend), Heroku / Google Cloud (Backend), Local dev via Docker or native shell

## Sponsor Technologies Used
- **Groq:** Leveraged for AI-generated explanations and chat assistance in prediction workflows.  
- **Base:** Integrated via Wagmi & OnchainKit for Smart Wallet authentication and potential on-chain provenance tracking.  

## ✨ Key Features
- ✅ **AI-Enhanced CRISPR Prediction:** Submit DNA sequences to the DNABERT model; receive predictions and detailed AI-driven explanations.  
- ✅ **Real-Time Lab Monitoring Dashboard:** Visualize streaming data from lab instruments with anomaly detection.  
- ✅ **Integrated AI Assistant Hub:** Chat interface powered by Groq for brainstorming experiments and troubleshooting.  
- ✅ **Web3 Wallet Integration:** Onchain identity via Base Smart Wallets using RainbowKit and Wagmi.  
- ✅ **Modular Architecture:** Clear separation of Python predictor, Node.js backend, and Next.js frontend for scalability.

## 📽️ Demo & Deliverables
- **Demo Video:** 
- **Pitch Deck:** 

## 🧪 How to Run the Project

### Requirements
- **Node.js:** v18+  
- **Python:** v3.12.3
- **GitLab:** CI/CD Pipelines  
- **MongoDB:** Local instance or MongoDB Atlas  
- **API Keys:** Groq API Key, WalletConnect Project ID, Base RPC URL, Google Cloud  

### Environment Variables

#### Backend (`/backend/.env`)
```dotenv
# Server configuration
NODE_ENV=development # or production
PORT=8000 # Port the backend server listens on

# MongoDB configuration
MONGO_URI=your_mongodb_connection_string # Connection string for MongoDB Atlas or local instance

# JWT configuration
JWT_SECRET=your_long_random_jwt_secret # Secret key for signing JSON Web Tokens
JWT_EXPIRY=30d # How long tokens remain valid (e.g., 30d, 1h)

# Cookie configuration (if using cookie-based sessions)
COOKIE_SECRET=your_long_random_cookie_secret # Secret for signing session cookies

# Groq API configuration
GROQ_API_KEY=gsk_your_groq_api_key # API key from console.groq.com

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000 # URL of the running frontend application
# FRONTEND_URL=https://your_deployed_frontend_url.com # Example for production

# Base blockchain configuration (for read-only checks, if applicable)
# RPC_URL=https://sepolia.base.org # RPC endpoint for Base network (e.g., Sepolia testnet)
# CONTRACT_ADDRESS=0xYourContractAddress... # Address of relevant smart contract on Base

#Google Cloud configuration
 GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
 GOOGLE_CLIENT_SECRET=your_google_client_secret
 GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback # Backend callback URL
 FRONTEND_REDIRECT_URI=http://localhost:3000/auth/google/callback # Frontend redirect URL after auth

# Prediction Service URL (Python FastAPI service)
PREDICTION_SERVICE_URL=http://localhost:4000 # URL where the genepredictor service is running

# Email configuration (e.g., Mailtrap)
# MAILTRAP_API_TOKEN=your_mailtrap_api_token
# EMAIL_FROM=noreply@yourdomain.com # Email address to send from

# (Optional) Private key for wallet operations or signing
# PRIVATE_KEY=your_blockchain_private_key
# (Optional) Basescan API key for interacting with BaseScan API
# BASESCAN_API_KEY=your_basescan_api_key
# (Optional) Coinbase Developer Platform API Key 
# COINBASE_DEVELOPER_PLATFORM_API_KEY=your_coinbase_api_key
```

#### Frontend (`/frontend/.env.local`)
```dotenv
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api # URL for the running backend service

# Blockchain Configuration (Choose Testnet OR Mainnet)
# -- Base Sepolia Testnet --
# NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
# NEXT_PUBLIC_CHAIN_ID=84532
# NEXT_PUBLIC_BLOCKCHAIN_DAPP_URL=https://sepolia.basescan.org # Explorer URL

# -- Base Mainnet --
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_BLOCKCHAIN_DAPP_URL=https://basescan.org # Explorer URL

# Blockchain Providers (Required for WalletConnect/Wagmi)
NEXT_PUBLIC_WALLETCONNECTv2_PROJECT_ID=your_walletconnect_project_id # Project ID from WalletConnect Cloud
# NEXT_PUBLIC_ALCHEMY_KEY=your_alchemy_api_key # Optional: If using Alchemy RPCs

# Google OAuth Client ID (if enabled)
# NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# App Environment
NEXT_PUBLIC_NODE_ENV=development # Usually 'development' or 'production'
NEXT_PUBLIC_APP_ENV=development # Custom environment flag (e.g., 'development', 'staging', 'production')

# Optional Placeholder Wallet Addresses (Usually not needed in .env)
# NEXT_PUBLIC_ETH_ADDRESS=0xYourPlaceholderAddress...
# NEXT_PUBLIC_SOL_ADDRESS=YourSolanaPlaceholderAddress...
```

### Local Setup

1. **Clone the repository**
    ```bash
   git clone 
   cd BioNova
   ```

2. **Start the Gene Predictor Server**
   ```bash
   # Navigate to the Python predictor folder
   cd genepredictor
   # Make run_server.sh executable if needed
   chmod +x run_server.sh
   # Launch the DNABERT-based predictor (creates venv and installs dependencies)
   bash run_server.sh
   ```
   - The predictor API will run at: **http://localhost:4000**  
   - This script sets up a Python 3.12.3 virtual environment (`dnabert_env`) with:
     - `torch`, `transformers`, `protobuf`, `einops`, `accelerate`, `fastapi`, `uvicorn`, `numpy`

3. **Install and Start Backend Server**
    ```bash
   # Open a new terminal (or background the predictor)
   cd ../backend
   npm install
   # Copy .env.example to .env and fill in variables
   cp .env.example .env
   # Start in development mode
   npm run dev
   ```
   - Backend API: **http://localhost:8000**

4. **Install and Start Frontend Development Server**
    ```bash
   cd ../frontend
   npm install
   # Copy .env.local.example to .env.local and fill in variables
   cp .env.local.example .env.local
   npm run dev
   ```
   - Frontend UI: **http://localhost:3000**

> **Tip:** You can view combined logs by running all services in separate terminal panes or using a terminal multiplexer like `tmux`.

## 🧬 Future Scope
- 🧠 **Advanced AI Integration & RAG:** Implement a sophisticated Retrieval-Augmented Generation (RAG) system using a knowledge graph, vector database (e.g., Pinecone, Chroma), and the Groq API for highly contextual AI assistance and data analysis.
- 🤖 **Agentic UI/Workflows:** Evolve the platform towards an agent-based model where users can delegate complex multi-step tasks (e.g., "design guide RNAs for gene X, verify against off-target database, and log results on-chain") to the Groq-powered AI assistant via natural language prompts.
- 📈 **Expanded & Retrainable Models:** Integrate more specialized genomic models (e.g., CRISPR off-target scoring, protein folding prediction) and build a complete model retraining pipeline incorporating user feedback and new external datasets for continuous improvement.
- 📡 **Automated Advanced IoT:** Fully automate the IoT integration with more precise sensors (e.g., specific gas sensors, particle counters) and add automated calibration and fault detection.
- 🔗 **Enhanced Data Integration:** Deepen integration with external public genomic databases (e.g., NCBI, Ensembl) not just for context but also for feeding the model retraining pipeline.
- 🛡️ **Advanced Blockchain Security & Features:** Implement advanced cryptographic techniques (e.g., zero-knowledge proofs for data privacy) and more complex smart contracts on Base for granular data sharing permissions, result verification, and potentially tokenized access control.
- 🐳 **Containerized CI/CD:** Establish a complete Docker-based CI/CD pipeline for consistent testing, building, and deployment across all services (Frontend, Backend, Python Predictor).
- 🤝 **Enhanced Collaboration:** Develop robust collaboration features supporting granular roles and permissions for organizations and individual researchers, including shared project spaces and versioned experiment tracking.
- 🌐 **Localization & Accessibility:** Implement multi-language support and ensure adherence to WCAG accessibility standards.

## 📎 Resources
- **APIs:** [Groq Cloud API](https://console.groq.com), [WalletConnect](https://docs.walletconnect.com) 

- **Open Source Libraries:** Next.js, React, FastAPI, DNABERT, MongoDB, Socket.IO, Tailwind CSS, Shadcn/ui, Wagmi, Viem, GitLab, Google Cloud, OnchainKit.  
