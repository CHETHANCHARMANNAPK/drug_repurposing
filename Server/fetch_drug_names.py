"""
Fetch drug names from ChEMBL API and save to CSV.
This only needs to run once to create the mapping file.
"""
import csv
import requests
import time
from pathlib import Path

# Read all drug IDs from training data
drugs_file = Path(__file__).parent / "checkpoints" / "drugs_list.csv"
output_file = Path(__file__).parent / "checkpoints" / "drug_names.csv"

def fetch_drug_name(chembl_id):
    """Fetch drug name from ChEMBL API."""
    try:
        url = f"https://www.ebi.ac.uk/chembl/api/data/molecule/{chembl_id}.json"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            # Try different name fields in order of preference
            name = data.get('pref_name') or data.get('molecule_synonyms', [{}])[0].get('molecule_synonym') if data.get('molecule_synonyms') else None
            if not name and data.get('molecule_synonyms'):
                for syn in data['molecule_synonyms']:
                    if syn.get('molecule_synonym'):
                        name = syn['molecule_synonym']
                        break
            return name
    except Exception as e:
        print(f"Error fetching {chembl_id}: {e}")
    return None

def main():
    # Read drug IDs
    drug_ids = []
    with open(drugs_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            drug_ids.append(row['drug_id'])
    
    print(f"Found {len(drug_ids)} drugs to look up")
    
    # Fetch names
    drug_names = {}
    for i, drug_id in enumerate(drug_ids):
        if (i + 1) % 50 == 0:
            print(f"Progress: {i+1}/{len(drug_ids)}")
        
        name = fetch_drug_name(drug_id)
        if name:
            drug_names[drug_id] = name
            print(f"  {drug_id} -> {name}")
        else:
            drug_names[drug_id] = drug_id  # Fallback to ID
        
        # Rate limiting
        time.sleep(0.1)
    
    # Save to CSV
    with open(output_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['drug_id', 'drug_name'])
        for drug_id, name in drug_names.items():
            writer.writerow([drug_id, name])
    
    print(f"\nSaved {len(drug_names)} drug names to {output_file}")

if __name__ == '__main__':
    main()
