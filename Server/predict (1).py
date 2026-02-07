#!/usr/bin/env python
"""
Drug Repurposing Prediction Script

Takes a disease name as input and outputs ranked drug repurposing candidates.

Usage:
    python scripts/predict.py "Parkinson's disease"
    python scripts/predict.py "diabetes" --top 20
    python scripts/predict.py "MONDO_0005180" --format json
"""

import argparse
import json
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import pandas as pd
import numpy as np
import joblib

from config import CHECKPOINTS_DIR, FEATURE_NAMES
from src.opentargets_client import OpenTargetsClient
from src.data_loader import DataLoader
from src.feature_engine import FeatureEngine
from src.gates import PostModelGates
from src.explainer import DrugExplainer


def search_disease(client: OpenTargetsClient, query: str) -> dict:
    """Search for a disease by name or ID, preferring actual diseases over phenotypes."""
    # Check if it's an ID format (EFO_, MONDO_, etc.)
    if any(query.upper().startswith(prefix) for prefix in ['EFO_', 'MONDO_', 'ORPHANET_', 'HP_']):
        # Direct lookup by ID
        genes = client.get_disease_genes(query, limit=1)
        if genes:
            return {'disease_id': query, 'disease_name': query}
        return None
    
    # Search by name
    results = client.search_diseases(query, limit=10)  # Get more results to filter
    if not results:
        return None
    
    # Filter out measurements, phenotypes, and symptoms - prefer actual diseases
    exclusion_terms = ['measurement', 'symptom', 'phenotype', 'trait', 'biomarker']
    
    # First pass: find results with MONDO or disease-type IDs (these are real diseases)
    for result in results:
        disease_id = result.get('disease_id', '').upper()
        disease_name = result.get('disease_name', '').lower()
        
        # Skip if it contains exclusion terms
        if any(term in disease_name for term in exclusion_terms):
            continue
        
        # Prefer MONDO IDs (these are actual diseases)
        if disease_id.startswith('MONDO_'):
            return result
    
    # Second pass: any result without exclusion terms
    for result in results:
        disease_name = result.get('disease_name', '').lower()
        if not any(term in disease_name for term in exclusion_terms):
            return result
    
    # Fallback to first result if nothing else matches
    return results[0]


def get_candidate_drugs(client: OpenTargetsClient, disease_id: str = None, limit: int = 100) -> list:
    """
    Get a list of candidate drugs to score.
    
    First gets drugs linked to the disease from OpenTargets, then adds
    major approved drugs to ensure comprehensive coverage.
    """
    all_drugs = {}
    
    # 1. Get drugs that OpenTargets links to this disease (most relevant!)
    if disease_id:
        try:
            # Get drugs with known associations to this disease
            disease_drugs = client.get_drugs_for_disease(disease_id, limit=50)
            for drug in disease_drugs:
                drug_id = drug.get('drug_id')
                if drug_id and drug_id.startswith('CHEMBL'):
                    all_drugs[drug_id] = drug
        except Exception:
            pass
    
    # 2. Add major approved drugs across therapeutic categories
    major_drug_searches = [
        # Neurological
        "levodopa", "dopamine", "pramipexole", "ropinirole", "rasagiline",
        # Common therapeutic categories
        "metformin", "atorvastatin", "aspirin", "ibuprofen", "prednisone",
        "adalimumab", "rituximab", "insulin", "warfarin", "gabapentin"
    ]
    
    for query in major_drug_searches:
        try:
            drugs = client.search_drugs(query, limit=5)
            for drug in drugs:
                drug_id = drug.get('drug_id')
                if drug_id and drug_id.startswith('CHEMBL'):
                    all_drugs[drug_id] = drug
        except Exception:
            continue
    
    return list(all_drugs.values())[:limit]


def apply_guardrails(predictions: list, disease_name: str, disease_id: str, engine, client) -> list:
    """
    Apply domain-based guardrails to penalize biologically invalid predictions.
    
    Key guardrails:
    - Parkinson's: Penalize D2 antagonists, anticholinergics
    - Cancer: Penalize oncogene activators
    
    Args:
        predictions: List of prediction dicts with 'drug_id', 'drug_name', 'score'
        disease_name: Name of the disease
        disease_id: EFO/MONDO ID
        engine: FeatureEngine for composite score
        client: OpenTargets client for drug properties
    
    Returns:
        Updated predictions with guardrail penalties applied
    """
    disease_lower = disease_name.lower()
    
    # Get therapeutic area for disease
    ta = client.get_disease_therapeutic_area(disease_id)
    therapeutic_area = ta.get('therapeutic_area', 'OTHER')
    
    for pred in predictions:
        drug_id = pred['drug_id']
        original_score = pred['score']
        penalty = 1.0  # No penalty by default
        
        # Get drug mechanism
        try:
            drug_props = client.get_drug_properties(drug_id)
            mechanism = drug_props.get('mechanism_class', 'UNKNOWN')
        except:
            mechanism = 'UNKNOWN'
        
        # ============================================================
        # PARKINSON'S DISEASE GUARDRAILS
        # ============================================================
        if 'parkinson' in disease_lower:
            # D2 antagonists WORSEN Parkinson's
            if mechanism == 'DOPAMINE_ANTAGONIST':
                penalty = 0.1  # 90% penalty
                pred['guardrail'] = '⚠️ D2 antagonist (contraindicated for PD)'
            
            # Anticholinergics are risky for elderly PD patients
            elif mechanism == 'ANTICHOLINERGIC':
                penalty = 0.3  # 70% penalty
                pred['guardrail'] = '⚠️ Anticholinergic (risky for PD)'
            
            # Boost dopamine agonists
            elif mechanism == 'DOPAMINE_AGONIST':
                penalty = 1.2  # 20% boost
                pred['guardrail'] = '✓ Dopamine agonist (aligned with PD)'
        
        # ============================================================
        # CANCER GUARDRAILS  
        # ============================================================
        elif therapeutic_area == 'ONCOLOGY':
            # Kinase inhibitors are generally aligned for cancer
            if mechanism == 'KINASE_INHIBITOR':
                penalty = 1.1
                pred['guardrail'] = '✓ Kinase inhibitor (aligned with oncology)'
            
            # Antibodies are often good for cancer
            elif mechanism == 'ANTIBODY':
                penalty = 1.1
                pred['guardrail'] = '✓ Antibody (aligned with oncology)'
        
        # ============================================================
        # APPLY PENALTY
        # ============================================================
        pred['score'] = original_score * penalty
        pred['mechanism'] = mechanism
        
        # Add composite score as secondary ranking info
        try:
            features = engine.compute_features(drug_id, disease_id)
            pred['composite_score'] = engine.compute_composite_score(features)
        except:
            pred['composite_score'] = pred['score']
    
    return predictions


def predict_drug_repurposing(disease_query: str, top_k: int = 10, output_format: str = 'table', use_gates: bool = True, explain: bool = False) -> str:
    """
    Predict drug repurposing candidates for a disease.
    
    Args:
        disease_query: Disease name or ID to search for
        top_k: Number of top candidates to return
        output_format: 'table', 'json', or 'csv'
        use_gates: Apply post-model gates (therapeutic area, drug type, mechanism)
        explain: Add SHAP explanations for top predictions
    
    Returns:
        Formatted string with predictions
    """
    # Initialize clients
    print(f"\n🔍 Searching for disease: {disease_query}", file=sys.stderr)
    client = OpenTargetsClient(use_cache=True)
    
    # Find disease
    disease = search_disease(client, disease_query)
    if not disease:
        return f"❌ Disease not found: {disease_query}"
    
    disease_id = disease['disease_id']
    disease_name = disease['disease_name']
    print(f"✓ Found: {disease_name} ({disease_id})", file=sys.stderr)
    
    # Load trained model - check for temporal model first, then old format
    model_path_json = CHECKPOINTS_DIR / "xgb_temporal_model.json"
    model_path_joblib = CHECKPOINTS_DIR / "final_xgb_classifier.joblib"
    scaler_path = CHECKPOINTS_DIR / "feature_scaler.joblib"
    
    if model_path_json.exists():
        print(f"📊 Loading temporal model from {model_path_json}", file=sys.stderr)
        import xgboost as xgb
        model = xgb.XGBClassifier()
        model.load_model(str(model_path_json))
    elif model_path_joblib.exists():
        print(f"📊 Loading model from {model_path_joblib}", file=sys.stderr)
        model = joblib.load(model_path_joblib)
    else:
        return f"❌ Model not found. Please run training first:\n   python scripts/train_temporal.py --drugs 200 --diseases 10"
    
    scaler = joblib.load(scaler_path) if scaler_path.exists() else None
    
    # Get candidate drugs (prioritize drugs linked to this disease)
    print("💊 Fetching candidate drugs...", file=sys.stderr)
    candidate_drugs = get_candidate_drugs(client, disease_id=disease_id, limit=100)
    
    if not candidate_drugs:
        return "❌ No candidate drugs found"
    
    print(f"   Found {len(candidate_drugs)} candidates", file=sys.stderr)
    
    # Initialize feature engine
    loader = DataLoader(use_cache=True)
    engine = FeatureEngine(
        opentargets_client=client,
        structure_handler=loader.structure_handler
    )
    
    # Compute features for each drug-disease pair
    print("🔧 Computing features...", file=sys.stderr)
    predictions = []
    
    for drug in candidate_drugs:
        drug_id = drug['drug_id']
        drug_name = drug['drug_name']
        
        try:
            # Compute features
            features = engine.compute_features(drug_id, disease_id)
            feature_vector = [features.get(f, 0.0) for f in FEATURE_NAMES]
            
            # Scale features if scaler available (use DataFrame to avoid warnings)
            if scaler:
                import warnings
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    feature_vector = scaler.transform([feature_vector])[0]
            
            # Predict probability
            prob = model.predict_proba([feature_vector])[0][1]
            
            predictions.append({
                'drug_id': drug_id,
                'drug_name': drug_name,
                'score': float(prob),
                'gene_overlap': features.get('gene_overlap_count', 0),
                'association_score': features.get('max_association_score', 0)
            })
        except Exception as e:
            # Skip drugs that fail feature computation
            continue
    
    if not predictions:
        return "❌ Could not compute predictions for any candidates"
    
    # Apply guardrails (domain-based penalties)
    predictions = apply_guardrails(predictions, disease_name, disease_id, engine, client)
    
    # Apply post-model gates if enabled
    if use_gates:
        print("🚦 Applying post-model gates...", file=sys.stderr)
        gates = PostModelGates(opentargets_client=client)
        
        drug_ids = [p['drug_id'] for p in predictions]
        base_scores = pd.Series([p['score'] for p in predictions])
        
        # Extract features for gate connection
        features_list = []
        for p in predictions:
            # We need to recover the features used for prediction
            # Since we didn't store the full feature dict in the prediction object,
            # we'll reconstruct a minimal one from what we saved
            features_list.append({
                'gene_overlap_count': p.get('gene_overlap', 0),
                'max_association_score': p.get('association_score', 0)
            })
        
        adjusted_scores, gate_details = gates.apply_gates(
            base_scores, 
            drug_ids, 
            disease_id,
            features_list=features_list
        )
        
        # Update predictions with gated scores
        for i, p in enumerate(predictions):
            p['base_score'] = p['score']
            p['score'] = adjusted_scores.iloc[i]
            p['gate_multiplier'] = gate_details.iloc[i]['total_multiplier']
    
    # Sort by score
    predictions.sort(key=lambda x: x['score'], reverse=True)
    top_predictions = predictions[:top_k]
    
    # Format output
    if output_format == 'json':
        return json.dumps({
            'disease': {'id': disease_id, 'name': disease_name},
            'predictions': top_predictions
        }, indent=2)
    
    elif output_format == 'csv':
        lines = ['drug_id,drug_name,score,gene_overlap,association_score']
        for p in top_predictions:
            lines.append(f"{p['drug_id']},{p['drug_name']},{p['score']:.4f},{p['gene_overlap']},{p['association_score']:.4f}")
        return '\n'.join(lines)
    
    else:  # table format
        lines = [
            f"\n{'='*70}",
            f"🧬 DRUG REPURPOSING CANDIDATES FOR: {disease_name}",
            f"   Disease ID: {disease_id}",
            f"{'='*70}\n",
            f"{'Rank':<6}{'Drug Name':<25}{'Score':<10}{'Gene Overlap':<15}{'Assoc. Score':<12}",
            f"{'-'*70}"
        ]
        
        for i, p in enumerate(top_predictions, 1):
            lines.append(
                f"{i:<6}{p['drug_name'][:24]:<25}{p['score']:.4f}    {p['gene_overlap']:<15}{p['association_score']:.4f}"
            )
        
        lines.append(f"\n{'='*70}")
        lines.append(f"Total candidates evaluated: {len(predictions)}")
        lines.append(f"Model: XGBoost Classifier")
        lines.append(f"{'='*70}\n")
        
        return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(
        description='Predict drug repurposing candidates for a disease',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python scripts/predict.py "Parkinson's disease"
    python scripts/predict.py "diabetes" --top 20
    python scripts/predict.py "MONDO_0005180" --format json
    python scripts/predict.py "breast cancer" --format csv > results.csv
        """
    )
    
    parser.add_argument('disease', help='Disease name or ID (e.g., "Parkinson\'s disease" or "MONDO_0005180")')
    parser.add_argument('--top', '-n', type=int, default=10, help='Number of top candidates to return (default: 10)')
    parser.add_argument('--format', '-f', choices=['table', 'json', 'csv'], default='table',
                       help='Output format (default: table)')
    parser.add_argument('--no-gates', action='store_true', help='Disable post-model gates')
    parser.add_argument('--explain', '-e', action='store_true', help='Add SHAP explanations for top predictions')
    
    args = parser.parse_args()
    
    result = predict_drug_repurposing(
        args.disease, 
        args.top, 
        args.format,
        use_gates=not args.no_gates,
        explain=args.explain
    )
    print(result)


if __name__ == '__main__':
    main()
