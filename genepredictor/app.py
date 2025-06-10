from fastapi import FastAPI, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
import os
import random
import numpy as np
from transformers import AutoModel, AutoTokenizer
from pydantic import BaseModel
from datetime import datetime

# Force CPU usage
os.environ["CUDA_VISIBLE_DEVICES"] = ""
os.environ["USE_TORCH"] = "1"
os.environ["USE_CUDA"] = "0"
os.environ["USE_TRITON"] = "0"

app = FastAPI()

# Add CORS middleware to allow requests from React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"]  # Exposes all headers
)

# Constants
MODEL_NAME = "zhihan1996/DNABERT-2-117M"
BASES = ['A', 'T', 'C', 'G']
device = "cpu"
torch.set_num_threads(4)  # Adjust based on your CPU cores

# Seed for reproducibility
def set_seed(seed=42):
    torch.manual_seed(seed)
    torch.cuda.manual_seed(seed)
    np.random.seed(seed)
    random.seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

set_seed()

# Load model and tokenizer
print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
print("Loading model...")
try:
    # Use our tested CPU-only configuration
    model = AutoModel.from_pretrained(
        MODEL_NAME, 
        trust_remote_code=True,
        torch_dtype=torch.float32,
        device_map="cpu"
    )
except Exception as e:
    print(f"Error loading DNABERT-2 model: {e}")
    # If first attempt fails, try with additional parameters
    try:
        print("Trying alternative loading method...")
        model = AutoModel.from_pretrained(
            MODEL_NAME,
            trust_remote_code=True,
            low_cpu_mem_usage=True,
            torch_dtype=torch.float32
        )
    except Exception as e:
        print(f"Alternative loading method failed: {e}")
        # Last resort - use fallback method
        try:
            print("Using fallback loading method...")
            from transformers import AutoConfig, BertModel
            config = AutoConfig.from_pretrained(MODEL_NAME, trust_remote_code=True)
            model = BertModel.from_pretrained(MODEL_NAME, config=config)
        except Exception as e:
            print(f"All loading attempts failed: {e}")
            print("Falling back to basic BERT model...")
            # Final fallback - use a basic BERT model
            from transformers import BertModel, BertConfig
            fallback_model = "bert-base-uncased"
            model = BertModel.from_pretrained(fallback_model)
            print(f"Loaded fallback model: {fallback_model}")

print("Model loaded successfully!")
model.eval()
for param in model.parameters():
    param.requires_grad = False

# Helper functions
def get_token_embeddings(sequence):
    inputs = tokenizer(sequence, return_tensors="pt", truncation=True, padding=True, max_length=512)
    
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Handle different output formats using the same approach as in run_dnabert.py
    if isinstance(outputs, tuple):
        hidden_states = outputs[0]
    elif hasattr(outputs, 'last_hidden_state'):
        hidden_states = outputs.last_hidden_state
    else:
        hidden_states = outputs
    
    return hidden_states.squeeze(0)

def generate_reference_token_embedding(sequences):
    all_token_embeds = []
    max_len = 0
    for seq in sequences:
        token_embed = get_token_embeddings(seq)
        all_token_embeds.append(token_embed)
        max_len = max(max_len, token_embed.size(0))

    padded_embeds = []
    for emb in all_token_embeds:
        pad_size = max_len - emb.size(0)
        if pad_size > 0:
            emb = torch.cat([emb, torch.zeros(pad_size, emb.size(1), device=device)], dim=0)
        padded_embeds.append(emb)

    return torch.stack(padded_embeds).mean(dim=0)

def find_problematic_position(token_embeddings, reference_embeddings):
    cos = torch.nn.CosineSimilarity(dim=1)
    similarities = cos(token_embeddings, reference_embeddings[:token_embeddings.size(0)])
    return torch.argmin(similarities).item()

def choose_best_alternate_base(seq, idx, reference_token_embeddings):
    best_base = None
    best_score = -1
    original_base = seq[idx]

    for base in [b for b in BASES if b != original_base]:
        new_seq = seq[:idx] + base + seq[idx + 1:]
        token_embeds = get_token_embeddings(new_seq)
        sequence_embed = token_embeds.mean(dim=0).unsqueeze(0)
        reference_mean = reference_token_embeddings.mean(dim=0).unsqueeze(0)
        score = torch.cosine_similarity(sequence_embed, reference_mean).item()
        if score > best_score:
            best_score = score
            best_base = base

    return best_base, best_score

def get_sequence_score(seq, reference_token_embeddings):
    token_embeds = get_token_embeddings(seq)
    sequence_embed = token_embeds.mean(dim=0).unsqueeze(0)
    reference_mean = reference_token_embeddings.mean(dim=0).unsqueeze(0)
    return torch.cosine_similarity(sequence_embed, reference_mean).item()

def predict_edit(seq, reference_token_embeddings):
    token_embeds = get_token_embeddings(seq)
    problem_idx = find_problematic_position(token_embeds, reference_token_embeddings)
    new_base, edited_score = choose_best_alternate_base(seq, problem_idx, reference_token_embeddings)
    edited_seq = seq[:problem_idx] + new_base + seq[problem_idx + 1:]
    return edited_seq, problem_idx, new_base, edited_score

# Reference sequences
REFERENCE_SEQUENCES = [
    "CTACTTCAAATGGGGCTACA",
    "AGTCGTACTGCATGCTCGTA",
    "ATCGCTGACAATGCTGGACA"
]

# Initialize reference embeddings
print("Generating reference embeddings...")
REFERENCE_EMBEDDINGS = generate_reference_token_embedding(REFERENCE_SEQUENCES)
print("Reference embeddings ready!")

# Pydantic model for request validation
class DNASequence(BaseModel):
    sequence: str

@app.post("/predict")
async def predict_sequence(data: DNASequence):
    try:
        sequence = data.sequence.upper()
        
        # Validate input
        if len(sequence) != 20:
            return JSONResponse(
                status_code=400,
                content={"error": "Sequence must be exactly 20 characters long"}
            )
        
        if not all(c in BASES for c in sequence):
            return JSONResponse(
                status_code=400,
                content={"error": "Sequence must contain only A, T, C, G"}
            )

        original_score = get_sequence_score(sequence, REFERENCE_EMBEDDINGS)
        edited_seq, index, base, edited_score = predict_edit(sequence, REFERENCE_EMBEDDINGS)
        
        # Convert score to percentage for the app
        efficiency = int(edited_score * 100)
        original_efficiency = int(original_score * 100)
        
        # Create change indicator string
        change_indicator = '.' * 20
        if index < len(change_indicator):
            change_indicator = change_indicator[:index] + '*' + change_indicator[index+1:]

        # Determine the message based on score comparison
        if edited_score > original_score:
            message = f"🔼 Editing improves similarity from {original_efficiency}% to {efficiency}%"
        else:
            message = f"✅ Sequence is already optimal (similarity: {original_efficiency}%)"

        return {
            "originalSequence": sequence,
            "editedSequence": edited_seq,
            "changeIndicator": change_indicator,
            "efficiency": efficiency,
            "changedPosition": index + 1,
            "originalBase": sequence[index],
            "newBase": base,
            "message": message,
            "originalEfficiency": original_efficiency  # Added for more context
        }
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring server status"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=4000, reload=True)
