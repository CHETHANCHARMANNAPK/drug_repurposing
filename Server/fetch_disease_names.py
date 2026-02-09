"""
Bulk fetch disease names from OpenTargets Platform API.
This script fetches human-readable names for all unique disease IDs in the dataset.
Results are cached to a JSON file for fast loading by the Flask server.
"""

import pandas as pd
import requests
import json
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# OpenTargets Platform GraphQL endpoint
OPENTARGETS_API = "https://api.platform.opentargets.org/api/v4/graphql"

# Paths
API_DIR = Path(__file__).parent / "API"
CHECKPOINTS_DIR = Path(__file__).parent / "checkpoints"
CACHE_FILE = CHECKPOINTS_DIR / "disease_names_full_cache.json"

def fetch_disease_name_batch(disease_ids: list) -> dict:
    """Fetch disease names for a batch of IDs using GraphQL."""
    
    # Build query for multiple diseases
    query = """
    query diseaseNames($ids: [String!]!) {
        diseases(efoIds: $ids) {
            id
            name
        }
    }
    """
    
    try:
        response = requests.post(
            OPENTARGETS_API,
            json={"query": query, "variables": {"ids": disease_ids}},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if "data" in data and data["data"]["diseases"]:
                return {d["id"]: d["name"] for d in data["data"]["diseases"] if d}
        return {}
    except Exception as e:
        print(f"Error fetching batch: {e}")
        return {}


def fetch_single_disease(disease_id: str) -> tuple:
    """Fetch a single disease name - fallback for GraphQL failures."""
    
    query = """
    query disease($id: String!) {
        disease(efoId: $id) {
            id
            name
        }
    }
    """
    
    try:
        response = requests.post(
            OPENTARGETS_API,
            json={"query": query, "variables": {"id": disease_id}},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "data" in data and data["data"]["disease"]:
                return (disease_id, data["data"]["disease"]["name"])
    except:
        pass
    return (disease_id, None)


def main():
    print("=" * 60)
    print("Disease Name Fetcher - OpenTargets Platform")
    print("=" * 60)
    
    # Load unique disease IDs from the dataset
    features_path = API_DIR / "features_merged.csv"
    if not features_path.exists():
        print(f"Error: {features_path} not found")
        return
    
    df = pd.read_csv(features_path)
    unique_diseases = list(df['disease_id'].unique())
    print(f"\nFound {len(unique_diseases)} unique diseases")
    
    # Load existing cache
    existing_cache = {}
    if CACHE_FILE.exists():
        with open(CACHE_FILE, 'r') as f:
            existing_cache = json.load(f)
        print(f"Loaded {len(existing_cache)} cached names")
    
    # Find diseases without names
    missing = [d for d in unique_diseases if d not in existing_cache]
    print(f"Missing names: {len(missing)}")
    
    if not missing:
        print("All disease names are already cached!")
        return
    
    # Fetch in batches of 100
    batch_size = 100
    results = dict(existing_cache)
    
    print(f"\nFetching names in batches of {batch_size}...")
    
    for i in range(0, len(missing), batch_size):
        batch = missing[i:i+batch_size]
        batch_results = fetch_disease_name_batch(batch)
        results.update(batch_results)
        
        # Progress
        progress = min(i + batch_size, len(missing))
        fetched = len([b for b in batch if b in batch_results])
        print(f"  Progress: {progress}/{len(missing)} | Batch success: {fetched}/{len(batch)}")
        
        # Save checkpoint every 10 batches
        if (i // batch_size + 1) % 10 == 0:
            with open(CACHE_FILE, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"  → Checkpoint saved ({len(results)} names)")
        
        # Rate limiting
        time.sleep(0.5)
    
    # For diseases that still don't have names, try individual fetch
    still_missing = [d for d in missing if d not in results]
    if still_missing:
        print(f"\nFetching {len(still_missing)} remaining diseases individually...")
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(fetch_single_disease, d): d for d in still_missing[:500]}  # Limit to 500
            
            for future in as_completed(futures):
                disease_id, name = future.result()
                if name:
                    results[disease_id] = name
    
    # Final save
    with open(CACHE_FILE, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n" + "=" * 60)
    print(f"Complete! Cached {len(results)} disease names")
    print(f"Saved to: {CACHE_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    main()
