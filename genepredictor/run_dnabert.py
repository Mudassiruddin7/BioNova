import os
import torch
from transformers import AutoTokenizer, AutoModel

# Force CPU usage
os.environ["CUDA_VISIBLE_DEVICES"] = ""
torch.set_num_threads(4)  # Adjust based on your CPU cores

# Disable GPU-specific modules
os.environ["USE_TORCH"] = "1"
os.environ["USE_CUDA"] = "0"
os.environ["USE_TRITON"] = "0"

print("Loading DNABERT-2-117M model and tokenizer (CPU version)...")

try:
    # Load the tokenizer and model
    tokenizer = AutoTokenizer.from_pretrained(
        "zhihan1996/DNABERT-2-117M", 
        trust_remote_code=True
    )
    
    model = AutoModel.from_pretrained(
        "zhihan1996/DNABERT-2-117M", 
        trust_remote_code=True,
        torch_dtype=torch.float32,
        device_map="cpu"
    )
    
    # Example DNA sequence
dna = "ACGTAGCATCGGATCTATCTATCGACACTTGGTTATCGATCTACGAGCATCTCGTTAGC"
print(f"Processing DNA sequence: {dna[:20]}...")
    
    # Tokenize input
    inputs = tokenizer(dna, return_tensors='pt')
    
    # Run model inference
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Extract hidden states (the first element of the output tuple)
    hidden_states = outputs[0]
    
    # Apply pooling strategies to get fixed-size embeddings
embedding_mean = torch.mean(hidden_states[0], dim=0)
print(f"Mean pooling embedding shape: {embedding_mean.shape}")

embedding_max = torch.max(hidden_states[0], dim=0)[0]
print(f"Max pooling embedding shape: {embedding_max.shape}")
    
    # Example usage of embeddings
    print("\nFirst 5 values of mean-pooled embedding:")
    print(embedding_mean[:5].numpy())
    
    print("\nFirst 5 values of max-pooled embedding:")
    print(embedding_max[:5].numpy())
    
    print("\nSuccessfully processed DNA sequence!")
    
except Exception as e:
    print(f"Error: {str(e)}")
    print("\nAlternative method:")
    print("You need to install git-lfs to properly download the model weights:")
    print("1. Install git-lfs: 'sudo dnf install git-lfs' on Fedora")
    print("2. Run: 'git lfs install'")
    print("3. Clone the repo: 'git clone https://huggingface.co/zhihan1996/DNABERT-2-117M'")
    print("4. Pull LFS files: 'cd DNABERT-2-117M && git lfs pull'")
    print("5. Copy to your project directory")
