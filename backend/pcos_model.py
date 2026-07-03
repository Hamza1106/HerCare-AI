import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import pickle
import os

def generate_synthetic_data(num_samples=541):
    """
    Generates a synthetic dataset resembling the Kaggle PCOS Clinical Dataset.
    Includes 541 records and realistic correlations for key clinical features.
    """
    np.random.seed(42)
    
    # 0 = No PCOS, 1 = PCOS
    # Let's say ~33% positive rate in clinical reporting
    pcos_labels = np.random.binomial(n=1, p=0.33, size=num_samples)
    
    data = []
    for is_pcos in pcos_labels:
        # Age: typically 18 to 45
        age = int(np.random.normal(loc=28 if is_pcos else 31, scale=5))
        age = max(15, min(50, age))
        
        # Cycle regularity: 1 = regular, 2 = irregular
        # Much higher probability of irregular cycles in PCOS
        if is_pcos:
            cycle_regularity = np.random.choice([1, 2], p=[0.15, 0.85])
            cycle_length = int(np.random.normal(loc=40, scale=8))
        else:
            cycle_regularity = np.random.choice([1, 2], p=[0.85, 0.15])
            cycle_length = int(np.random.normal(loc=28, scale=2))
        
        cycle_length = max(20, min(60, cycle_length))
        
        # Weight & Height (calculate BMI)
        height = np.random.normal(loc=158, scale=6) # in cm
        if is_pcos:
            weight = np.random.normal(loc=72, scale=12) # higher weight trend
            weight_gain = np.random.choice([0, 1], p=[0.25, 0.75])
            hirsutism = np.random.choice([0, 1], p=[0.2, 0.8])
            acne = np.random.choice([0, 1], p=[0.3, 0.7])
            skin_darkening = np.random.choice([0, 1], p=[0.25, 0.75])
            hair_thinning = np.random.choice([0, 1], p=[0.35, 0.65])
        else:
            weight = np.random.normal(loc=61, scale=10)
            weight_gain = np.random.choice([0, 1], p=[0.8, 0.2])
            hirsutism = np.random.choice([0, 1], p=[0.9, 0.1])
            acne = np.random.choice([0, 1], p=[0.8, 0.2])
            skin_darkening = np.random.choice([0, 1], p=[0.9, 0.1])
            hair_thinning = np.random.choice([0, 1], p=[0.85, 0.15])
            
        bmi = weight / ((height / 100.0) ** 2)
        
        # Follicle count: High follicle counts are a key diagnostic indicator
        if is_pcos:
            follicle_l = int(np.random.normal(loc=12, scale=3))
            follicle_r = int(np.random.normal(loc=13, scale=3))
        else:
            follicle_l = int(np.random.normal(loc=5, scale=2))
            follicle_r = int(np.random.normal(loc=6, scale=2))
            
        follicle_l = max(0, follicle_l)
        follicle_r = max(0, follicle_r)
        
        # Fast food consumption
        fast_food = np.random.choice([0, 1], p=[0.6, 0.4] if is_pcos else [0.8, 0.2])
        # Regular exercise
        exercise = np.random.choice([0, 1], p=[0.3, 0.7] if is_pcos else [0.6, 0.4])
        
        # Add to dataset
        data.append({
            'Age': age,
            'Weight': round(weight, 1),
            'Height': round(height, 1),
            'BMI': round(bmi, 2),
            'CycleRegularity': cycle_regularity,
            'CycleLength': cycle_length,
            'WeightGain': weight_gain,
            'Hirsutism': hirsutism,
            'Acne': acne,
            'SkinDarkening': skin_darkening,
            'HairThinning': hair_thinning,
            'FollicleNumL': follicle_l,
            'FollicleNumR': follicle_r,
            'FastFood': fast_food,
            'Exercise': exercise,
            'PCOS': is_pcos
        })
        
    return pd.DataFrame(data)

def main():
    print("Generating synthetic PCOS clinical dataset (541 records, 15 key features)...")
    df = generate_synthetic_data()
    
    # Define features and target
    features = [
        'Age', 'BMI', 'CycleRegularity', 'CycleLength', 
        'WeightGain', 'Hirsutism', 'Acne', 'SkinDarkening', 
        'HairThinning', 'FollicleNumL', 'FollicleNumR', 
        'FastFood', 'Exercise'
    ]
    
    X = df[features]
    y = df['PCOS']
    
    # Split dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"Training set size: {X_train.shape[0]}")
    print(f"Testing set size: {X_test.shape[0]}")
    
    # Train Random Forest Classifier
    clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    clf.fit(X_train, y_train)
    
    # Predict and evaluate
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save the model
    model_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(model_dir, "pcos_model.pkl")
    
    model_data = {
        'model': clf,
        'features': features,
        'accuracy': accuracy
    }
    
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
        
    print(f"Model saved successfully to {model_path}!")

if __name__ == "__main__":
    main()
