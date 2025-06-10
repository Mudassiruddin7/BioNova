#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========== DNA Sequence Prediction Server Setup (Direct) =========="

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Install required packages directly if not already installed
echo "Installing/Verifying dependencies..."
python -m pip install --upgrade pip

# Install packages with specific versions
echo "Installing PyTorch (CPU version)..."
python -m pip install torch==2.6.0+cpu --extra-index-url https://download.pytorch.org/whl/cpu

echo "Installing other dependencies..."
python -m pip install transformers==4.35.2 \
    protobuf==4.25.1 \
    einops==0.7.0 \
    accelerate==0.25.0 \
    fastapi==0.109.0 \
    uvicorn==0.27.0 \
    numpy==1.26.3

# Set environment variables to ensure CPU-only usage
export CUDA_VISIBLE_DEVICES=""
export USE_TORCH=1
export USE_CUDA=0
export USE_TRITON=0

# Inform the user
echo ""
echo "========== Starting DNA Sequence Prediction Server =========="
echo "API will be available at http://localhost:4000"
echo "Example usage with curl:"
echo "curl -X POST http://localhost:4000/predict -H \"Content-Type: application/json\" -d '{\"sequence\": \"ACGTAGCATCGGATCTATCT\"}'"
echo "Health check: curl http://localhost:4000/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo "==========================================================="
echo ""

# Run the FastAPI server
cd "$SCRIPT_DIR"
exec python app.py