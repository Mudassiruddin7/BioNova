import requests
import json
import sys

# Set the Python FastAPI URL here
API_URL = "http://localhost:4000/predict"

# Test sequences
TEST_SEQUENCES = [
    "ACGTAGCATCGGATCTATCT",  # Valid 20-character sequence
    "TTTTAAAACCCGGGGGNNNN",  # Invalid sequence with N's
    "ACGT",                  # Too short sequence
]

def test_prediction(sequence):
    """Test the prediction API with a given sequence"""
    print(f"\nTesting with sequence: {sequence}")
    print("-" * 50)
    
    try:
        response = requests.post(
            API_URL,
            headers={"Content-Type": "application/json"},
            json={"sequence": sequence}
        )
        
        print(f"Status code: {response.status_code}")
        
        # Try to parse as JSON
        try:
            data = response.json()
            print("Response:")
            print(json.dumps(data, indent=2))
        except json.JSONDecodeError:
            print("Response (not JSON):")
            print(response.text)
        
    except requests.RequestException as e:
        print(f"Error: {e}")
        
    print()

def main():
    """Run the tests"""
    print(f"Testing DNA Prediction API at: {API_URL}")
    print("=" * 50)
    
    for sequence in TEST_SEQUENCES:
        test_prediction(sequence)

if __name__ == "__main__":
    main() 