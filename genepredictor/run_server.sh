#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========== DNA Sequence Prediction Server Setup =========="

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
VENV_PATH="$SCRIPT_DIR/dnabert_env"

# Check if environment already exists
if [ -d "$VENV_PATH" ]; then
    echo "Environment already exists. Using existing environment..."
    CREATE_ENV=false
else
    CREATE_ENV=true
fi

# Create and setup the environment if needed
if [ "$CREATE_ENV" = true ]; then
    echo "Creating new virtual environment with Python 3.12..."
    python -m venv "$VENV_PATH"


    echo "Activating virtual environment..."
    source "$VENV_PATH/Scripts/activate"

    echo "Installing CPU-only dependencies..."
    pip install --upgrade pip
    pip install torch==2.7.0
    pip install transformers==4.51.3 protobuf==6.30.2 einops==0.8.1 accelerate==1.6.0 fastapi==0.115.12 uvicorn==0.34.2 numpy==2.2.5

    # Save dependencies to requirements.txt
    cat > "$SCRIPT_DIR/requirements.txt" << EOL
torch==2.6.0+cpu
transformers==4.51.3
protobuf==6.30.2
einops==0.8.1
accelerate==1.6.0
fastapi==0.115.12
uvicorn==0.34.2
numpy==2.2.5
EOL

else
    echo "Activating existing virtual environment..."
    source "$VENV_PATH/Scripts/activate"

    echo "Ensuring server dependencies are installed..."
    pip install --upgrade pip
    pip install -r "$SCRIPT_DIR/requirements.txt"
fi

# Set environment variables for CPU-only usage
export CUDA_VISIBLE_DEVICES=""
export USE_TORCH=1
export USE_CUDA=0
export USE_TRITON=0

# Start server
echo ""
echo "========== Starting DNA Sequence Prediction Server =========="
echo "API will be available at http://localhost:4000"
echo "Example usage:"
echo "curl -X POST http://localhost:4000/predict -H \"Content-Type: application/json\" -d '{\"sequence\": \"ACGTAGCATCGGATCTATCT\"}'"
echo ""
echo "Press Ctrl+C to stop the server"
echo "==========================================================="
echo ""

cd "$SCRIPT_DIR"
python app.py
