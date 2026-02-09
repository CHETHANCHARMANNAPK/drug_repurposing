"""
Drug Repurposing Prediction API Server

Flask backend that serves predictions from the trained XGBoost model.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
from pathlib import Path
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Paths
CHECKPOINTS_DIR = Path(__file__).parent / "checkpoints"
API_MODEL_DIR = Path(__file__).parent / "API"

# Feature names (must match the XGBoost model's expected features exactly)
FEATURE_NAMES = [
    'genetic_score',
    'somatic_score_raw',
    'somatic_score_masked',
    'max_association_score',
    'gene_overlap_count',
    'mean_plddt',
    'low_confidence_frac'
]

# Disease name mapping (common diseases)
DISEASE_NAMES = {
    'EFO_0000503': 'Alzheimer\'s Disease',
    'EFO_0002508': 'Parkinson\'s Disease', 
    'MONDO_0005180': 'Parkinson\'s Disease',
    'EFO_0000384': 'Crohn\'s Disease',
    'EFO_0000685': 'Rheumatoid Arthritis',
    'EFO_0000616': 'Type 2 Diabetes',
    'EFO_0000764': 'Breast Cancer',
    'EFO_0000311': 'Cancer',
    'EFO_0000756': 'Non-small Cell Lung Carcinoma',
    'EFO_0001378': 'Colorectal Cancer',
    'EFO_0000571': 'Leukemia',
    'EFO_0000673': 'Lymphoma',
    'EFO_0000691': 'Melanoma',
    'EFO_0000181': 'Prostate Cancer',
    'EFO_0000182': 'Ovarian Cancer',
    'EFO_0000220': 'Acute Myeloid Leukemia',
    'EFO_0000305': 'Bladder Cancer',
    'EFO_0000341': 'Headache/Migraine',
    'EFO_0000389': 'Liver Disease',
    'EFO_0000574': 'Multiple Sclerosis',
    'EFO_0000612': 'Multiple Myeloma',
    'EFO_0000676': 'Psoriasis',
    'EFO_0000694': 'Neuroblastoma',
    'EFO_0000699': 'Osteosarcoma',
    'EFO_0000702': 'Pancreatic Cancer',
    'EFO_0000708': 'Kidney/Renal Cancer',
    'EFO_0001073': 'Thyroid Cancer',
    'EFO_0001645': 'Coronary Heart Disease',
    'EFO_0001663': 'Prostate Adenocarcinoma',
    'EFO_0002609': 'Ulcerative Colitis',
    'EFO_0003060': 'Hepatocellular Carcinoma',
    'EFO_0003086': 'Acute Lymphoblastic Leukemia',
    'EFO_0003144': 'Schizophrenia',
    'EFO_0003778': 'Asthma',
    'EFO_0003884': 'Glioblastoma',
    'EFO_0003898': 'Heart Failure',
    'EFO_0004198': 'Epilepsy',
    'EFO_0004220': 'Depression',
    'EFO_0005952': 'Gastric Cancer',
    'EFO_0006859': 'Brain Cancer',
    'EFO_0006861': 'Sarcoma',
    'EFO_0008583': 'Chronic Lymphocytic Leukemia',
    'MONDO_0004992': 'Cancer',
    'MONDO_0002087': 'Anxiety Disorder',
    'EFO_0000095': 'Chronic Kidney Disease',
    'EFO_0000183': 'Hypertension',
    'EFO_0000196': 'Osteoporosis',
    'EFO_0000211': 'Systemic Lupus Erythematosus',
    'EFO_0000222': 'Diabetic Retinopathy',
    'EFO_0000231': 'Autism Spectrum Disorder',
    'EFO_0000313': 'Cardiomyopathy',
    'EFO_0000514': 'Macular Degeneration',
    'EFO_0000537': 'Bipolar Disorder',
    'EFO_0000763': 'Atopic Dermatitis (Eczema)',
    'EFO_0000765': 'Psoriatic Arthritis',
    'EFO_0001075': 'Uveitis',
    'EFO_0002617': 'Ankylosing Spondylitis',
    'EFO_0003073': 'Inflammatory Bowel Disease',
    'EFO_0004232': 'Cluster Headache',
    'EFO_0004776': 'ADHD',
    'EFO_0005149': 'Type 1 Diabetes',
}

# Drug name mapping - comprehensive list of pharmaceutical compounds
DRUG_NAMES = {
    # Biologics / Monoclonal Antibodies
    'CHEMBL1201577': 'Adalimumab',
    'CHEMBL1201572': 'Infliximab',
    'CHEMBL1201431': 'Rituximab',
    'CHEMBL1201199': 'Bevacizumab',
    'CHEMBL1201560': 'Trastuzumab',
    'CHEMBL1201566': 'Cetuximab',
    'CHEMBL2107885': 'Pembrolizumab',
    'CHEMBL1201670': 'Tocilizumab',
    'CHEMBL1201561': 'Secukinumab',
    'CHEMBL1201533': 'Nivolumab',
    'CHEMBL1201570': 'Ustekinumab',
    'CHEMBL1201564': 'Natalizumab',
    'CHEMBL1201497': 'Vedolizumab',
    'CHEMBL1201666': 'Ipilimumab',
    'CHEMBL2103749': 'Durvalumab',
    'CHEMBL1201419': 'Ranibizumab',
    'CHEMBL1201538': 'Aflibercept',
    'CHEMBL1201580': 'Golimumab',
    'CHEMBL1201632': 'Certolizumab',
    'CHEMBL1201584': 'Abatacept',
    'CHEMBL1201506': 'Etanercept',
    'CHEMBL2108175': 'Atezolizumab',
    'CHEMBL1743082': 'Daratumumab',
    'CHEMBL1201585': 'Denosumab',
    'CHEMBL1201583': 'Belimumab',
    
    # Small Molecule Targeted Therapies
    'CHEMBL1201247': 'Imatinib',
    'CHEMBL1201565': 'Bortezomib',
    'CHEMBL1201568': 'Lenalidomide',
    'CHEMBL2108791': 'Ibrutinib',
    'CHEMBL1789941': 'Crizotinib',
    'CHEMBL1201825': 'Erlotinib',
    'CHEMBL1336': 'Gefitinib',
    'CHEMBL1201081': 'Sorafenib',
    'CHEMBL1201607': 'Sunitinib',
    'CHEMBL1421': 'Lapatinib',
    'CHEMBL1201583': 'Vemurafenib',
    'CHEMBL2146883': 'Dabrafenib',
    'CHEMBL2103877': 'Trametinib',
    'CHEMBL3545110': 'Osimertinib',
    'CHEMBL3301607': 'Palbociclib',
    'CHEMBL3301612': 'Ribociclib',
    'CHEMBL3989908': 'Abemaciclib',
    'CHEMBL2007641': 'Olaparib',
    'CHEMBL3545396': 'Rucaparib',
    'CHEMBL3545422': 'Niraparib',
    'CHEMBL1201752': 'Ruxolitinib',
    'CHEMBL2105738': 'Tofacitinib',
    'CHEMBL3301593': 'Baricitinib',
    'CHEMBL3707348': 'Upadacitinib',
    
    # Common Pain/Anti-inflammatory
    'CHEMBL160': 'Aspirin',
    'CHEMBL139': 'Ibuprofen',
    'CHEMBL25': 'Acetaminophen',
    'CHEMBL113': 'Naproxen',
    'CHEMBL118': 'Diclofenac',
    'CHEMBL635': 'Celecoxib',
    'CHEMBL21': 'Indomethacin',
    'CHEMBL607': 'Meloxicam',
    'CHEMBL800': 'Piroxicam',
    'CHEMBL122': 'Ketoprofen',
    
    # Diabetes Medications
    'CHEMBL1429': 'Metformin',
    'CHEMBL1371': 'Glipizide',
    'CHEMBL1455': 'Glyburide',
    'CHEMBL1475': 'Pioglitazone',
    'CHEMBL595': 'Rosiglitazone',
    'CHEMBL1380': 'Glimepiride',
    'CHEMBL2103875': 'Sitagliptin',
    'CHEMBL2110588': 'Saxagliptin',
    'CHEMBL3707227': 'Empagliflozin',
    'CHEMBL2104389': 'Dapagliflozin',
    'CHEMBL2109584': 'Canagliflozin',
    'CHEMBL2110582': 'Linagliptin',
    'CHEMBL1201489': 'Liraglutide',
    'CHEMBL3707259': 'Semaglutide',
    
    # Cardiovascular
    'CHEMBL1069': 'Atorvastatin',
    'CHEMBL1064': 'Simvastatin',
    'CHEMBL1393': 'Pravastatin',
    'CHEMBL1078': 'Rosuvastatin',
    'CHEMBL1092': 'Lisinopril',
    'CHEMBL1560': 'Enalapril',
    'CHEMBL1095': 'Ramipril',
    'CHEMBL1094': 'Amlodipine',
    'CHEMBL768': 'Diltiazem',
    'CHEMBL1096': 'Verapamil',
    'CHEMBL1558': 'Losartan',
    'CHEMBL1091': 'Valsartan',
    'CHEMBL1559': 'Irbesartan',
    'CHEMBL42': 'Propranolol',
    'CHEMBL34': 'Metoprolol',
    'CHEMBL545': 'Atenolol',
    'CHEMBL21423': 'Carvedilol',
    'CHEMBL409': 'Bisoprolol',
    'CHEMBL1201': 'Digoxin',
    'CHEMBL639': 'Warfarin',
    'CHEMBL50': 'Heparin',
    'CHEMBL1873475': 'Rivaroxaban',
    'CHEMBL2103833': 'Apixaban',
    'CHEMBL2028663': 'Dabigatran',
    'CHEMBL1200970': 'Clopidogrel',
    
    # Neurological/Psychiatric
    'CHEMBL1201589': 'Sumatriptan',
    'CHEMBL972': 'Sertraline',
    'CHEMBL41': 'Fluoxetine',
    'CHEMBL1508': 'Paroxetine',
    'CHEMBL1256': 'Citalopram',
    'CHEMBL1185': 'Escitalopram',
    'CHEMBL710': 'Venlafaxine',
    'CHEMBL1118': 'Duloxetine',
    'CHEMBL1098659': 'Bupropion',
    'CHEMBL628': 'Mirtazapine',
    'CHEMBL22': 'Amitriptyline',
    'CHEMBL47': 'Nortriptyline',
    'CHEMBL1194': 'Quetiapine',
    'CHEMBL97': 'Olanzapine',
    'CHEMBL85': 'Risperidone',
    'CHEMBL135': 'Haloperidol',
    'CHEMBL6015': 'Aripiprazole',
    'CHEMBL910': 'Ziprasidone',
    'CHEMBL1346': 'Clozapine',
    'CHEMBL567': 'Lithium',
    'CHEMBL109': 'Valproic acid',
    'CHEMBL108': 'Carbamazepine',
    'CHEMBL121': 'Gabapentin',
    'CHEMBL1059': 'Pregabalin',
    'CHEMBL1236': 'Levetiracetam',
    'CHEMBL127': 'Lamotrigine',
    'CHEMBL698': 'Phenytoin',
    'CHEMBL114': 'Topiramate',
    'CHEMBL661': 'Zolpidem',
    'CHEMBL40': 'Diazepam',
    'CHEMBL391': 'Alprazolam',
    'CHEMBL46': 'Lorazepam',
    'CHEMBL445': 'Clonazepam',
    'CHEMBL1200979': 'Donepezil',
    'CHEMBL95': 'Rivastigmine',
    'CHEMBL2104088': 'Memantine',
    'CHEMBL103': 'Levodopa',
    'CHEMBL56': 'Carbidopa',
    'CHEMBL1200564': 'Pramipexole',
    'CHEMBL1201147': 'Ropinirole',
    
    # Antibiotics
    'CHEMBL1747': 'Amoxicillin',
    'CHEMBL1583': 'Azithromycin',
    'CHEMBL298': 'Ciprofloxacin',
    'CHEMBL16': 'Penicillin',
    'CHEMBL105': 'Doxycycline',
    'CHEMBL1200748': 'Metronidazole',
    'CHEMBL578': 'Trimethoprim',
    'CHEMBL467': 'Sulfamethoxazole',
    'CHEMBL1200986': 'Clarithromycin',
    'CHEMBL1404': 'Erythromycin',
    'CHEMBL1434': 'Cephalexin',
    'CHEMBL1163': 'Levofloxacin',
    'CHEMBL1200625': 'Moxifloxacin',
    'CHEMBL1517': 'Vancomycin',
    'CHEMBL1201': 'Gentamicin',
    'CHEMBL265132': 'Linezolid',
    'CHEMBL1568': 'Clindamycin',
    
    # Antivirals
    'CHEMBL1201528': 'Acyclovir',
    'CHEMBL934': 'Valacyclovir',
    'CHEMBL1200391': 'Oseltamivir',
    'CHEMBL1306': 'Ribavirin',
    'CHEMBL1200852': 'Tenofovir',
    'CHEMBL1091': 'Lamivudine',
    'CHEMBL1164729': 'Sofosbuvir',
    'CHEMBL1201387': 'Remdesivir',
    
    # Respiratory
    'CHEMBL1404': 'Fluticasone',
    'CHEMBL429': 'Budesonide',
    'CHEMBL1200692': 'Montelukast',
    'CHEMBL714': 'Albuterol/Salbutamol',
    'CHEMBL1441342': 'Tiotropium',
    'CHEMBL1201857': 'Omalizumab',
    
    # GI Medications
    'CHEMBL1406': 'Omeprazole',
    'CHEMBL559': 'Lansoprazole',
    'CHEMBL1615372': 'Pantoprazole',
    'CHEMBL1201620': 'Esomeprazole',
    'CHEMBL855': 'Ranitidine',
    'CHEMBL776': 'Famotidine',
    'CHEMBL1729': 'Ondansetron',
    'CHEMBL625': 'Loperamide',
    
    # Immunosuppressants
    'CHEMBL413': 'Cyclosporine',
    'CHEMBL299': 'Tacrolimus',
    'CHEMBL1642': 'Sirolimus',
    'CHEMBL1201752': 'Mycophenolate',
    'CHEMBL178': 'Azathioprine',
    'CHEMBL1201': 'Prednisone',
    'CHEMBL131': 'Dexamethasone',
    'CHEMBL389621': 'Methylprednisolone',
    'CHEMBL640': 'Hydrocortisone',
    
    # Oncology (additional)
    'CHEMBL163': 'Paclitaxel',
    'CHEMBL888': 'Docetaxel',
    'CHEMBL567': 'Cisplatin',
    'CHEMBL515': 'Carboplatin',
    'CHEMBL3353410': 'Oxaliplatin',
    'CHEMBL1475': 'Gemcitabine',
    'CHEMBL185': 'Fluorouracil (5-FU)',
    'CHEMBL34259': 'Capecitabine',
    'CHEMBL428': 'Methotrexate',
    'CHEMBL134': 'Doxorubicin',
    'CHEMBL1073': 'Cyclophosphamide',
    'CHEMBL1068': 'Tamoxifen',
    'CHEMBL1200374': 'Letrozole',
    'CHEMBL1773': 'Anastrozole',
    'CHEMBL941': 'Exemestane',
    'CHEMBL225072': 'Enzalutamide',
    'CHEMBL1201321': 'Abiraterone',
    'CHEMBL185': 'Etoposide',
    'CHEMBL1474': 'Vinblastine',
    'CHEMBL181': 'Vincristine',
    'CHEMBL1200485': 'Irinotecan',
    
    # Osteoporosis
    'CHEMBL1201389': 'Alendronate',
    'CHEMBL1200957': 'Risedronate',
    'CHEMBL1200684': 'Zoledronic acid',
    'CHEMBL1201587': 'Teriparatide',
    
    # Others
    'CHEMBL1201633': 'Fingolimod',
    'CHEMBL3545001': 'Dimethyl fumarate',
    'CHEMBL1201562': 'Lisdexamfetamine',
    'CHEMBL1201454': 'Methylphenidate',
    'CHEMBL1201620': 'Modafinil',
    'CHEMBL503': 'Sildenafil',
    'CHEMBL1520': 'Tadalafil',
    'CHEMBL1737': 'Vardenafil',
    'CHEMBL1201588': 'Finasteride',
    'CHEMBL1200871': 'Dutasteride',
    'CHEMBL941': 'Minoxidil',
    'CHEMBL939': 'Hydroxychloroquine',
}

# Global model and data (original model)
model = None
scaler = None
train_pairs = None
train_features = None
diseases_list = None
drugs_list = None

# Global model and data (new API model with larger dataset)
api_model = None
api_scaler = None
api_features_df = None

# Extended feature names for the new API model - must match model's expected features exactly
# The model was trained on 7 features in this exact order (verified via model.feature_names)
API_FEATURE_NAMES = [
    'genetic_score',
    'somatic_score_raw',
    'somatic_score_masked',
    'max_association_score',
    'gene_overlap_count',
    'mean_plddt',
    'low_confidence_frac'
]


def load_model_and_data():
    """Load the trained model and data files."""
    global model, scaler, train_pairs, train_features, diseases_list, drugs_list
    
    # Load XGBoost model using Booster (for JSON format)
    model_path = CHECKPOINTS_DIR / "xgb_temporal_model.json"
    if model_path.exists():
        try:
            model = xgb.Booster()
            model.load_model(str(model_path))
            print(f"✓ Loaded XGBoost model from {model_path}")
        except Exception as e:
            print(f"✗ Error loading model: {e}")
            model = None
    else:
        print(f"✗ Model not found at {model_path}")
    
    # Load scaler
    scaler_path = CHECKPOINTS_DIR / "feature_scaler.joblib"
    if scaler_path.exists():
        scaler = joblib.load(scaler_path)
        print(f"✓ Loaded scaler from {scaler_path}")
    
    # Load training pairs
    pairs_path = CHECKPOINTS_DIR / "train_pairs.csv"
    if pairs_path.exists():
        train_pairs = pd.read_csv(pairs_path)
        print(f"✓ Loaded {len(train_pairs)} training pairs")
    
    # Load training features
    features_path = CHECKPOINTS_DIR / "train_features_checkpoint.csv"
    if features_path.exists():
        train_features = pd.read_csv(features_path)
        print(f"✓ Loaded {len(train_features)} training feature rows")
    
    # Load disease and drug lists
    diseases_path = CHECKPOINTS_DIR / "diseases_list.csv"
    if diseases_path.exists():
        diseases_list = pd.read_csv(diseases_path)
        print(f"✓ Loaded {len(diseases_list)} diseases")
    
    drugs_path = CHECKPOINTS_DIR / "drugs_list.csv"
    if drugs_path.exists():
        drugs_list = pd.read_csv(drugs_path)
        print(f"✓ Loaded {len(drugs_list)} drugs")
    
    # Load drug name cache
    _load_drug_name_cache()
    
    # Load disease name cache
    _load_disease_name_cache()
    
    return train_pairs is not None and train_features is not None


def load_api_model():
    """Load the new XGBoost model and dataset from the API folder."""
    global api_model, api_scaler, api_features_df
    
    print("\n--- Loading API Model (Extended Dataset) ---")
    
    # Load XGBoost model from API folder
    model_path = API_MODEL_DIR / "xgb_temporal_model.json"
    if model_path.exists():
        try:
            api_model = xgb.Booster()
            api_model.load_model(str(model_path))
            print(f"✓ Loaded API XGBoost model from {model_path}")
        except Exception as e:
            print(f"✗ Error loading API model: {e}")
            api_model = None
    else:
        print(f"✗ API Model not found at {model_path}")
    
    # Load scaler from API folder
    scaler_path = API_MODEL_DIR / "feature_scaler.joblib"
    if scaler_path.exists():
        api_scaler = joblib.load(scaler_path)
        print(f"✓ Loaded API scaler from {scaler_path}")
    
    # Load the large features dataset
    features_path = API_MODEL_DIR / "features_merged.csv"
    if features_path.exists():
        api_features_df = pd.read_csv(features_path)
        print(f"✓ Loaded {len(api_features_df)} drug-disease pairs from API dataset")
        # Print unique counts
        unique_drugs = api_features_df['chembl_id'].nunique()
        unique_diseases = api_features_df['disease_id'].nunique()
        print(f"  → {unique_drugs} unique drugs, {unique_diseases} unique diseases")
    else:
        print(f"✗ Features file not found at {features_path}")
    
    return api_model is not None and api_features_df is not None


# Dynamic disease name cache (populated from OpenTargets API)
_disease_name_cache = {}
_disease_cache_file = CHECKPOINTS_DIR / "disease_names_cache.json"
_disease_full_cache_file = CHECKPOINTS_DIR / "disease_names_full_cache.json"

def _load_disease_name_cache():
    """Load disease name cache from file. Prioritizes full cache if available."""
    global _disease_name_cache
    
    # Try to load the full cache first (24K+ names)
    if _disease_full_cache_file.exists():
        try:
            import json
            with open(_disease_full_cache_file, 'r') as f:
                _disease_name_cache = json.load(f)
                print(f"✓ Loaded {len(_disease_name_cache)} disease names from full cache")
                return
        except Exception as e:
            print(f"Warning: Could not load full disease name cache: {e}")
    
    # Fall back to smaller cache
    if _disease_cache_file.exists():
        try:
            import json
            with open(_disease_cache_file, 'r') as f:
                _disease_name_cache = json.load(f)
                print(f"✓ Loaded {len(_disease_name_cache)} cached disease names")
        except Exception as e:
            print(f"Warning: Could not load disease name cache: {e}")

def _save_disease_name_cache():
    """Save disease name cache to file."""
    try:
        import json
        with open(_disease_cache_file, 'w') as f:
            json.dump(_disease_name_cache, f)
    except Exception as e:
        print(f"Warning: Could not save disease name cache: {e}")

def _fetch_disease_name_from_opentargets(disease_id: str) -> str:
    """Fetch disease name from OpenTargets Platform API."""
    try:
        import requests
        # OpenTargets GraphQL API
        url = "https://api.platform.opentargets.org/api/v4/graphql"
        query = """
        query DiseaseInfo($diseaseId: String!) {
            disease(efoId: $diseaseId) {
                name
            }
        }
        """
        response = requests.post(url, json={
            "query": query,
            "variables": {"diseaseId": disease_id}
        }, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('data', {}).get('disease'):
                return data['data']['disease']['name']
    except Exception as e:
        pass  # Silent fail
    return None

def get_disease_name(disease_id: str) -> str:
    """Get human-readable disease name from ID. Uses cache and OpenTargets API."""
    # Check static mapping first (fastest)
    if disease_id in DISEASE_NAMES:
        return DISEASE_NAMES[disease_id]
    
    # Check dynamic cache
    if disease_id in _disease_name_cache:
        return _disease_name_cache[disease_id]
    
    # Fetch from OpenTargets API
    name = _fetch_disease_name_from_opentargets(disease_id)
    if name:
        _disease_name_cache[disease_id] = name
        # Save cache periodically (every 10 new entries)
        if len(_disease_name_cache) % 10 == 0:
            _save_disease_name_cache()
        return name
    
    # Last resort: return the ID itself
    return disease_id

# Dynamic drug name cache (populated from ChEMBL API)
_drug_name_cache = {}
_cache_file = CHECKPOINTS_DIR / "drug_names_cache.json"

def _load_drug_name_cache():
    """Load drug name cache from file."""
    global _drug_name_cache
    if _cache_file.exists():
        try:
            import json
            with open(_cache_file, 'r') as f:
                _drug_name_cache = json.load(f)
                print(f"✓ Loaded {len(_drug_name_cache)} cached drug names")
        except Exception as e:
            print(f"Warning: Could not load drug name cache: {e}")

def _save_drug_name_cache():
    """Save drug name cache to file."""
    try:
        import json
        with open(_cache_file, 'w') as f:
            json.dump(_drug_name_cache, f)
    except Exception as e:
        print(f"Warning: Could not save drug name cache: {e}")

def _fetch_drug_name_from_chembl(drug_id: str) -> str:
    """Fetch drug name from ChEMBL API."""
    try:
        import requests
        url = f"https://www.ebi.ac.uk/chembl/api/data/molecule/{drug_id}.json"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            # Try pref_name first (most common)
            name = data.get('pref_name')
            if name:
                return name
            # Try molecule synonyms
            synonyms = data.get('molecule_synonyms', [])
            if synonyms:
                # Prefer INN or USAN names
                for syn in synonyms:
                    syn_type = syn.get('syn_type', '').upper()
                    if syn_type in ('INN', 'USAN', 'BAN'):
                        return syn.get('molecule_synonym', drug_id)
                # Fall back to any synonym
                return synonyms[0].get('molecule_synonym', drug_id)
    except Exception as e:
        pass  # Silent fail, return drug_id
    return None

def get_drug_name(drug_id: str) -> str:
    """Get human-readable drug name from ID. Uses cache and ChEMBL API."""
    # Check static mapping first (fastest)
    if drug_id in DRUG_NAMES:
        return DRUG_NAMES[drug_id]
    
    # Check dynamic cache
    if drug_id in _drug_name_cache:
        return _drug_name_cache[drug_id]
    
    # Fetch from ChEMBL API
    name = _fetch_drug_name_from_chembl(drug_id)
    if name:
        _drug_name_cache[drug_id] = name
        # Save cache periodically (every 10 new entries)
        if len(_drug_name_cache) % 10 == 0:
            _save_drug_name_cache()
        return name
    
    # Last resort: return the ID itself
    return drug_id


def get_confidence_tier(score: float) -> str:
    """Convert score to confidence tier."""
    if score >= 0.7:
        return 'high'
    elif score >= 0.4:
        return 'medium'
    else:
        return 'low'


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'data_loaded': train_pairs is not None
    })


@app.route('/api/diseases', methods=['GET'])
def get_diseases():
    """Get list of available diseases."""
    if diseases_list is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    # Get unique diseases from training data
    unique_diseases = train_pairs['disease_id'].unique() if train_pairs is not None else diseases_list['disease_id'].values
    
    # Build disease list with names
    diseases = []
    for disease_id in unique_diseases[:100]:  # Limit to 100 for performance
        diseases.append({
            'id': disease_id,
            'name': get_disease_name(disease_id),
            'category': 'Disease',  # Could be enhanced with real categories
            'description': f'Disease identifier: {disease_id}'
        })
    
    # Sort by whether we have a human-readable name
    diseases.sort(key=lambda d: (d['name'] == d['id'], d['name']))
    
    return jsonify(diseases)


@app.route('/api/predict/<disease_id>', methods=['GET'])
def predict_drugs(disease_id: str):
    """Predict drug repurposing candidates for a disease.
    
    Only returns drugs that have actual training data for this specific disease,
    ensuring predictions are disease-relevant.
    """
    if train_pairs is None or train_features is None:
        return jsonify({'error': 'Data not loaded'}), 500
    
    # Get top_k parameter
    top_k = request.args.get('top_k', 10, type=int)
    
    # Get ONLY drugs that have training data for this specific disease
    disease_mask = train_pairs['disease_id'] == disease_id
    disease_pairs = train_pairs[disease_mask]
    
    if len(disease_pairs) == 0:
        return jsonify({
            'disease': {
                'id': disease_id,
                'name': get_disease_name(disease_id)
            },
            'predictions': [],
            'message': 'No training data available for this disease'
        })
    
    predictions = []
    
    # Iterate only over drugs that have data for this disease
    for idx, row in disease_pairs.iterrows():
        drug_id = row['chembl_id']
        
        # Get features for this exact drug-disease pair
        if idx < len(train_features):
            features_row = train_features.iloc[idx]
            feature_vector = np.array([features_row.get(f, 0.0) for f in FEATURE_NAMES])
            
            # Predict probability
            try:
                if model is not None:
                    # Use DMatrix for Booster prediction
                    dmatrix = xgb.DMatrix(np.array([feature_vector]), feature_names=FEATURE_NAMES)
                    prob = float(model.predict(dmatrix)[0])
                    # Ensure prob is between 0 and 1 (might be raw score)
                    if prob < 0 or prob > 1:
                        prob = 1 / (1 + np.exp(-prob))  # Sigmoid
                else:
                    # Fallback: use feature-based scoring
                    gene_overlap = features_row.get('gene_overlap_count', 0)
                    assoc_score = features_row.get('max_association_score', 0)
                    prob = min(0.95, (gene_overlap * 0.1 + assoc_score) / 2)
                
                predictions.append({
                    'drug_id': drug_id,
                    'drug_name': get_drug_name(drug_id),
                    'score': float(prob),
                    'confidenceTier': get_confidence_tier(prob),
                    'gene_overlap': int(features_row.get('gene_overlap_count', 0)),
                    'association_score': float(features_row.get('max_association_score', 0)),
                    'mechanismSummary': f'ML prediction score: {prob:.2%}',
                    'diseaseRelevance': f'Predicted for {get_disease_name(disease_id)}',
                    'knownLimitations': ['This is a computational prediction', 'Clinical validation required'],
                    'targets': [],
                    'pathways': []
                })
            except Exception as e:
                print(f"Prediction error for {drug_id}: {e}")
                continue
    
    # Sort by score descending
    predictions.sort(key=lambda x: x['score'], reverse=True)
    
    return jsonify({
        'disease': {
            'id': disease_id,
            'name': get_disease_name(disease_id)
        },
        'predictions': predictions[:top_k]
    })


@app.route('/api/drug/<drug_id>', methods=['GET'])
def get_drug_details(drug_id: str):
    """Get details for a specific drug."""
    return jsonify({
        'id': drug_id,
        'name': get_drug_name(drug_id),
        'description': f'Drug identifier: {drug_id}',
        'originalUse': 'See clinical data for indications'
    })


@app.route('/api/molecule/<chembl_id>', methods=['GET'])
def get_molecule_structure(chembl_id: str):
    """Get 3D molecular structure for a drug from ChEMBL.
    
    Returns atoms with 3D coordinates and bond information for visualization.
    """
    try:
        import requests
        
        # Fetch SDF (3D structure) from ChEMBL
        sdf_url = f"https://www.ebi.ac.uk/chembl/api/data/molecule/{chembl_id}.sdf"
        response = requests.get(sdf_url, timeout=10)
        
        if response.status_code != 200:
            return jsonify({
                'error': 'Structure not available',
                'drug_id': chembl_id,
                'drug_name': get_drug_name(chembl_id)
            }), 404
        
        sdf_content = response.text
        
        # Parse the SDF file
        atoms = []
        bonds = []
        
        lines = sdf_content.split('\n')
        
        # SDF format: header lines, then counts line, then atoms, then bonds
        # Find the counts line (line 4 usually, format: "  X  Y  0  0  0  0...")
        counts_line_idx = 3
        if len(lines) > counts_line_idx:
            counts_line = lines[counts_line_idx].strip()
            parts = counts_line.split()
            if len(parts) >= 2:
                try:
                    num_atoms = int(parts[0])
                    num_bonds = int(parts[1])
                except ValueError:
                    num_atoms = 0
                    num_bonds = 0
                
                # Parse atom block (starts at line 5)
                atom_start = 4
                for i in range(num_atoms):
                    line_idx = atom_start + i
                    if line_idx < len(lines):
                        atom_line = lines[line_idx]
                        if len(atom_line) >= 30:
                            try:
                                # SDF format: X, Y, Z coordinates (10 chars each), then symbol
                                x = float(atom_line[0:10].strip())
                                y = float(atom_line[10:20].strip())
                                z = float(atom_line[20:30].strip())
                                symbol = atom_line[31:34].strip()
                                
                                atoms.append({
                                    'id': i,
                                    'symbol': symbol,
                                    'x': x,
                                    'y': y,
                                    'z': z
                                })
                            except (ValueError, IndexError):
                                continue
                
                # Parse bond block (after atoms)
                bond_start = atom_start + num_atoms
                for i in range(num_bonds):
                    line_idx = bond_start + i
                    if line_idx < len(lines):
                        bond_line = lines[line_idx]
                        parts = bond_line.split()
                        if len(parts) >= 3:
                            try:
                                # 1-indexed in SDF, convert to 0-indexed
                                start_atom = int(parts[0]) - 1
                                end_atom = int(parts[1]) - 1
                                bond_type = int(parts[2])  # 1=single, 2=double, 3=triple
                                
                                if 0 <= start_atom < len(atoms) and 0 <= end_atom < len(atoms):
                                    bonds.append({
                                        'start': start_atom,
                                        'end': end_atom,
                                        'type': bond_type
                                    })
                            except (ValueError, IndexError):
                                continue
        
        if not atoms:
            return jsonify({
                'error': 'Could not parse molecular structure',
                'drug_id': chembl_id,
                'drug_name': get_drug_name(chembl_id)
            }), 404
        
        return jsonify({
            'drug_id': chembl_id,
            'drug_name': get_drug_name(chembl_id),
            'atoms': atoms,
            'bonds': bonds,
            'atom_count': len(atoms),
            'bond_count': len(bonds)
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'drug_id': chembl_id,
            'drug_name': get_drug_name(chembl_id)
        }), 500


# ============================================================================
# NEW API ENDPOINTS - Using Extended Dataset (153K drug-disease pairs)
# ============================================================================

# Pre-computed diseases list (built at startup for fast access)
_precomputed_diseases = None

def _build_disease_cache():
    """Pre-compute all disease data at startup for fast access."""
    global _precomputed_diseases
    
    if api_features_df is None:
        return
    
    print("  → Building disease name cache...")
    unique_diseases = api_features_df['disease_id'].unique()
    
    diseases = []
    for disease_id in unique_diseases:
        # Get name from caches or use ID as fallback
        name = _disease_name_cache.get(disease_id) or DISEASE_NAMES.get(disease_id) or disease_id
        diseases.append({
            'id': disease_id,
            'name': name,
            'category': 'Disease'
        })
    
    # Sort: human-readable names first, then alphabetically
    diseases.sort(key=lambda d: (d['name'] == d['id'], d['name'].lower()))
    _precomputed_diseases = diseases
    print(f"  → Cached {len(diseases)} diseases")


@app.route('/api/v2/diseases', methods=['GET'])
def get_v2_diseases():
    """Get paginated list of diseases with optional search.
    
    Query params:
        search: filter diseases by name (case-insensitive)
        page: page number (default 1)
        limit: items per page (default 50, max 200)
    """
    if _precomputed_diseases is None:
        if api_features_df is None:
            return jsonify({'error': 'API data not loaded'}), 500
        _build_disease_cache()
    
    # Get query parameters
    search = request.args.get('search', '').lower().strip()
    page = request.args.get('page', 1, type=int)
    limit = min(request.args.get('limit', 50, type=int), 200)  # Max 200
    
    # Filter by search if provided
    if search:
        filtered = [d for d in _precomputed_diseases 
                   if search in d['name'].lower() or search in d['id'].lower()]
    else:
        filtered = _precomputed_diseases
    
    # Calculate pagination
    total = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated = filtered[start_idx:end_idx]
    
    return jsonify({
        'diseases': paginated,
        'total': total,
        'page': page,
        'limit': limit,
        'total_pages': (total + limit - 1) // limit
    })


@app.route('/api/v2/drugs', methods=['GET'])
def get_v2_drugs():
    """Get list of drugs from the extended API dataset."""
    if api_features_df is None:
        return jsonify({'error': 'API data not loaded'}), 500
    
    # Get unique drugs from the API dataset
    unique_drugs = api_features_df['chembl_id'].unique()
    
    drugs = []
    for drug_id in unique_drugs:  # Return all drugs
        # Use cached name only (no expensive API lookups)
        cached_name = _drug_name_cache.get(drug_id) or DRUG_NAMES.get(drug_id)
        name = cached_name if cached_name else drug_id
        
        drugs.append({
            'id': drug_id,
            'name': name,
            'description': f'Drug identifier: {drug_id}'
        })
    
    # Sort: human-readable names first, then by name alphabetically
    drugs.sort(key=lambda d: (d['name'] == d['id'], d['name'].lower()))
    
    return jsonify(drugs)


@app.route('/api/repurpose/<disease_id>', methods=['GET'])
def repurpose_drugs_for_disease(disease_id: str):
    """Find drug repurposing candidates for a disease using the extended model.
    
    This endpoint uses the larger 153K drug-disease pairs dataset
    to predict which drugs could potentially treat a given disease.
    """
    if api_features_df is None or api_model is None:
        return jsonify({'error': 'API model not loaded'}), 500
    
    top_k = request.args.get('top_k', 20, type=int)
    
    # Get all drug-disease pairs for this disease
    disease_data = api_features_df[api_features_df['disease_id'] == disease_id]
    
    if len(disease_data) == 0:
        return jsonify({
            'disease': {
                'id': disease_id,
                'name': get_disease_name(disease_id)
            },
            'predictions': [],
            'message': 'No data available for this disease in the extended dataset'
        })
    
    predictions = []
    
    for _, row in disease_data.iterrows():
        drug_id = row['chembl_id']
        
        # Extract features for prediction
        try:
            # Properly extract feature values from pandas Series
            feature_values = []
            for f in API_FEATURE_NAMES:
                val = row[f] if f in row.index else 0.0
                feature_values.append(float(val) if pd.notna(val) else 0.0)
            feature_vector = np.array(feature_values)
            
            if api_model is not None:
                dmatrix = xgb.DMatrix(np.array([feature_vector]), feature_names=API_FEATURE_NAMES)
                prob = float(api_model.predict(dmatrix)[0])
                # Ensure prob is between 0 and 1
                if prob < 0 or prob > 1:
                    prob = 1 / (1 + np.exp(-prob))  # Sigmoid
            else:
                # Fallback scoring
                prob = float(row['max_association_score']) if pd.notna(row['max_association_score']) else 0.5
            
            # Get additional feature info for explainability
            gene_overlap = int(row['gene_overlap_count']) if pd.notna(row['gene_overlap_count']) else 0
            assoc_score = float(row['max_association_score']) if pd.notna(row['max_association_score']) else 0.0
            gen_score = float(row['genetic_score']) if pd.notna(row['genetic_score']) else 0.0
            animal_score = float(row['animal_model_score']) if pd.notna(row['animal_model_score']) else 0.0
            known_score = float(row['known_drug_score']) if pd.notna(row['known_drug_score']) else 0.0
            max_phase = int(row['drug_max_phase']) if pd.notna(row['drug_max_phase']) else 0
            
            predictions.append({
                'drug_id': drug_id,
                'drug_name': get_drug_name(drug_id),
                'score': float(prob),
                'confidenceTier': get_confidence_tier(prob),
                'gene_overlap': gene_overlap,
                'association_score': assoc_score,
                'genetic_score': gen_score,
                'animal_model_score': animal_score,
                'known_drug_score': known_score,
                'drug_max_phase': max_phase,
                'mechanismSummary': f'Extended ML prediction score: {prob:.2%}',
                'diseaseRelevance': f'Based on {gene_overlap} overlapping genes',
                'knownLimitations': [
                    'Computational prediction - requires clinical validation',
                    f'Based on genetic/genomic association score of {row.get("max_association_score", 0):.2f}'
                ],
                'targets': [],
                'pathways': []
            })
        except Exception as e:
            import traceback
            print(f"Prediction error for {drug_id}: {e}")
            traceback.print_exc()
            continue
    
    # Sort by score descending
    predictions.sort(key=lambda x: x['score'], reverse=True)
    
    return jsonify({
        'disease': {
            'id': disease_id,
            'name': get_disease_name(disease_id)
        },
        'predictions': predictions[:top_k],
        'total_candidates': len(predictions),
        'model': 'extended_xgb_temporal'
    })


@app.route('/api/drug-diseases/<drug_id>', methods=['GET'])
def predict_diseases_for_drug(drug_id: str):
    """Predict which diseases a drug could potentially treat.
    
    This is the reverse lookup - given a drug, find all diseases
    it might be repurposed for based on the extended model.
    """
    if api_features_df is None or api_model is None:
        return jsonify({'error': 'API model not loaded'}), 500
    
    top_k = request.args.get('top_k', 20, type=int)
    
    # Get all entries for this drug
    drug_data = api_features_df[api_features_df['chembl_id'] == drug_id]
    
    if len(drug_data) == 0:
        return jsonify({
            'drug': {
                'id': drug_id,
                'name': get_drug_name(drug_id)
            },
            'predictions': [],
            'message': 'No data available for this drug in the extended dataset'
        })
    
    predictions = []
    
    for _, row in drug_data.iterrows():
        disease_id = row['disease_id']
        
        try:
            # Properly extract feature values from pandas Series
            feature_values = []
            for f in API_FEATURE_NAMES:
                val = row[f] if f in row.index else 0.0
                feature_values.append(float(val) if pd.notna(val) else 0.0)
            feature_vector = np.array(feature_values)
            
            if api_model is not None:
                dmatrix = xgb.DMatrix(np.array([feature_vector]), feature_names=API_FEATURE_NAMES)
                prob = float(api_model.predict(dmatrix)[0])
                if prob < 0 or prob > 1:
                    prob = 1 / (1 + np.exp(-prob))
            else:
                prob = float(row['max_association_score']) if pd.notna(row['max_association_score']) else 0.5
            
            gene_overlap = int(row['gene_overlap_count']) if pd.notna(row['gene_overlap_count']) else 0
            assoc_score = float(row['max_association_score']) if pd.notna(row['max_association_score']) else 0.0
            gen_score = float(row['genetic_score']) if pd.notna(row['genetic_score']) else 0.0
            
            predictions.append({
                'disease_id': disease_id,
                'disease_name': get_disease_name(disease_id),
                'score': float(prob),
                'confidenceTier': get_confidence_tier(prob),
                'gene_overlap': gene_overlap,
                'association_score': assoc_score,
                'genetic_score': gen_score,
                'mechanismSummary': f'Predicted repurposing score: {prob:.2%}'
            })
        except Exception as e:
            print(f"Prediction error for {disease_id}: {e}")
            continue
    
    # Sort by score descending
    predictions.sort(key=lambda x: x['score'], reverse=True)
    
    return jsonify({
        'drug': {
            'id': drug_id,
            'name': get_drug_name(drug_id)
        },
        'predictions': predictions[:top_k],
        'total_diseases': len(predictions),
        'model': 'extended_xgb_temporal'
    })


@app.route('/api/v2/health', methods=['GET'])
def health_check_v2():
    """Health check for the extended API model."""
    return jsonify({
        'status': 'healthy',
        'original_model_loaded': model is not None,
        'api_model_loaded': api_model is not None,
        'api_data_loaded': api_features_df is not None,
        'api_data_size': len(api_features_df) if api_features_df is not None else 0
    })


if __name__ == '__main__':
    print("\n" + "="*50)
    print("🧬 Drug Repurposing Prediction API")
    print("="*50 + "\n")
    
    # Load original model
    original_loaded = load_model_and_data()
    if original_loaded:
        print("\n✓ Original model data loaded successfully")
    
    # Load new API model with extended dataset
    api_loaded = load_api_model()
    if api_loaded:
        print("\n✓ Extended API model loaded successfully")
    
    if original_loaded or api_loaded:
        print("\n" + "="*50)
        print("Available endpoints:")
        print("  - /api/diseases (original model)")
        print("  - /api/predict/<disease_id> (original model)")
        print("  - /api/v2/diseases (extended model)")
        print("  - /api/v2/drugs (extended model)")
        print("  - /api/repurpose/<disease_id> (extended model)")
        print("  - /api/drug-diseases/<drug_id> (extended model)")
        print("="*50)
        print("\nStarting server on http://localhost:5001\n")
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        print("\n✗ Failed to load any model or data")
        exit(1)

