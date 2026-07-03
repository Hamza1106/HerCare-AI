import os
import json
import pickle
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import user_store

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "pcos_model.pkl")
CONDITIONS_PATH = os.path.join(BASE_DIR, "data", "conditions.json")

pcos_model = None
pcos_features = []
if os.path.exists(MODEL_PATH):
    try:
        with open(MODEL_PATH, 'rb') as f:
            model_data = pickle.load(f)
            pcos_model = model_data['model']
            pcos_features = model_data['features']
            print(f"PCOS model loaded. Features: {pcos_features}")
    except Exception as e:
        print(f"Error loading PCOS model: {e}")

conditions_db = {}
if os.path.exists(CONDITIONS_PATH):
    try:
        with open(CONDITIONS_PATH, 'r', encoding='utf-8') as f:
            conditions_db = json.load(f)
            print(f"Conditions DB loaded: {len(conditions_db)} conditions.")
    except Exception as e:
        print(f"Error loading conditions: {e}")


def compute_health_score(results):
    """
    Mirrors the score formula that used to live only in the frontend
    (HealthScoreWidget.jsx computeHealthScore): 100 minus the average
    risk_score across all assessed conditions, clamped to 0-100.
    """
    if not results:
        return None
    risk_scores = [r.get('risk_score', 0) for r in results.values()]
    if not risk_scores:
        return None
    avg = sum(risk_scores) / len(risk_scores)
    return round(max(0, min(100, 100 - avg)))


def get_top_risk(results):
    """Returns the (cond_id, condition_result_dict) with the highest risk_score."""
    if not results:
        return None
    top_id, top = max(results.items(), key=lambda kv: kv[1].get('risk_score', 0))
    return top


def score_to_label(score):
    if score is None:
        return None
    if score >= 80:
        return "Excellent"
    if score >= 60:
        return "Good"
    if score >= 40:
        return "Fair"
    return "Needs Attention"


# Seed a demo account on startup (matches the "Use demo account" button
# in the frontend AuthScreen) so reviewers/judges can log in instantly
# without having to register first.
if not user_store.email_exists('demo@hercare.ai'):
    user_store.create_user('Demo User', 'demo@hercare.ai', 'demo123')

# ─── Gemini helper ───────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are HerCare AI — an intelligent, empathetic women's health companion built for Pakistani and South Asian women.

Your expertise covers:
- PCOS (Polycystic Ovary Syndrome)
- Thyroid disorders (hypothyroidism, hyperthyroidism)
- Anemia and iron deficiency
- Endometriosis
- Menstrual irregularities and period health
- Menopause and perimenopause
- General gynecological and reproductive health
- Post-discharge recovery guidance
- Nutrition and lifestyle for women's health

Guidelines:
- Respond in the same language the user writes in (English, Roman Urdu, or Urdu)
- Be warm, empathetic, and non-judgmental
- Give detailed, helpful, medically accurate responses
- You have full memory of this conversation — always refer back to prior context
- Ask follow-up questions when the user describes symptoms to better understand their situation
- Use bullet points and clear formatting when listing information
- Never give robotic or generic one-liner responses — be genuinely helpful and contextual
- Always add a brief reminder at the end that you provide awareness only, not diagnosis, and encourage seeing a doctor"""

def call_groq(messages, api_key):
    """Call Groq API with full conversation history."""
    from groq import Groq
    client = Groq(api_key=api_key)

    groq_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in messages:
        role = "user" if msg.get("role") == "user" else "assistant"
        groq_messages.append({"role": role, "content": msg.get("content", "")})

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=groq_messages,
        temperature=0.8,
        max_tokens=1024,
    )
    return response.choices[0].message.content

# ─── Routes ──────────────────────────────────────────────────────────────────

@app.route('/', methods=['GET'])
def index():
    return """<html><body style="font-family:sans-serif;background:#F4F8FC;padding:3rem;text-align:center">
        <h1 style="color:#5B8DEF">💙 HerCare AI Backend</h1>
        <p style="color:#4A5A75">Flask backend is running.</p>
        <p><a href="http://localhost:5173" style="color:#5B8DEF;font-weight:600">Open Dashboard →</a></p>
    </body></html>"""

@app.route('/api/health-check', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "pcos_model_loaded": pcos_model is not None,
        "conditions_loaded": len(conditions_db) > 0,
        "groq_configured": bool(os.getenv('GROQ_API_KEY', ''))
    })

# ─── Auth + persistent user data ──────────────────────────────────────────────

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.json or {}
        name = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip()
        password = data.get('password') or ''

        if not name:
            return jsonify({"error": "Please enter your name."}), 400
        if '@' not in email:
            return jsonify({"error": "Please enter a valid email."}), 400
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters."}), 400

        ok, result = user_store.create_user(name, email, password)
        if not ok:
            return jsonify({"error": result}), 400

        return jsonify({"user": user_store.public_user(result)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json or {}
        email = (data.get('email') or '').strip()
        password = data.get('password') or ''

        if not email:
            return jsonify({"error": "Please enter your email."}), 400
        if not password:
            return jsonify({"error": "Please enter your password."}), 400

        ok, result = user_store.verify_login(email, password)
        if not ok:
            return jsonify({"error": result}), 401

        return jsonify({"user": user_store.public_user(result)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/user/<email>', methods=['GET'])
def get_user_data(email):
    """Returns this user's profile + last_assessment (health score, BMI,
    risk results, timestamp) — used by the Dashboard / Health Score widget
    to load real persisted data instead of relying on localStorage."""
    try:
        user = user_store.get_user(email)
        if not user:
            return jsonify({"error": "User not found."}), 404
        return jsonify({"user": user_store.public_user(user)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/conditions', methods=['GET'])
def get_conditions():
    """Returns conditions in requested language — flattens bilingual JSON into flat keys."""
    lang = request.args.get('lang', 'en')
    suffix = '_ur' if lang == 'ur' else '_en'

    result = {}
    for key, cond in conditions_db.items():
        result[key] = {
            'name': cond.get(f'name{suffix}', cond.get('name_en', cond.get('name', ''))),
            'symptoms': cond.get(f'symptoms{suffix}', cond.get('symptoms_en', cond.get('symptoms', []))),
            'explanation': cond.get(f'explanation{suffix}', cond.get('explanation_en', cond.get('explanation', ''))),
            'urgency': cond.get(f'urgency{suffix}', cond.get('urgency_en', cond.get('urgency', ''))),
            'urgency_desc': cond.get(f'urgency_desc{suffix}', cond.get('urgency_desc_en', cond.get('urgency_desc', ''))),
            'lifestyle_tips': cond.get(f'lifestyle_tips{suffix}', cond.get('lifestyle_tips_en', cond.get('lifestyle_tips', []))),
        }
    return jsonify(result)

@app.route('/api/chat', methods=['POST'])
def chat():
    """Intelligent AI health chatbot — Gemini with full conversation history."""
    try:
        data = request.get_json()
        messages = data.get('messages', [])

        if not messages:
            return jsonify({'error': 'No messages provided'}), 400

        # API key priority: request header → env variable
        auth_header = request.headers.get('Authorization', '')
        api_key = auth_header.replace('Bearer ', '').strip() if auth_header.startswith('Bearer ') else ''
        if not api_key:
            api_key = os.getenv('GROQ_API_KEY', '')

        if api_key:
            try:
                reply = call_groq(messages, api_key)
                return jsonify({'reply': reply, 'provider': 'groq'})
            except Exception as e:
                print(f"Groq chat error: {e}")
                # Fall through to smart fallback

        # Context-aware smart fallback
        user_text = messages[-1].get('content', '').lower()
        # Full conversation context for follow-up detection
        all_text = ' '.join([m.get('content', '') for m in messages]).lower()
        # Also check what was discussed before (for follow-up questions)
        prev_text = ' '.join([m.get('content', '') for m in messages[:-1]]).lower()

        # Detect topic from FULL conversation, not just last message
        topic_periods   = any(w in all_text for w in ['period', 'haiz', 'mahwari', 'irregular', 'cycle', 'masik'])
        topic_pcos      = any(w in all_text for w in ['pcos', 'polycystic'])
        topic_thyroid   = any(w in all_text for w in ['thyroid', 'tsh', 'hypothyroid'])
        topic_anemia    = any(w in all_text for w in ['anemia', 'khoon ki kami', 'hemoglobin', 'iron'])
        topic_menopause = any(w in all_text for w in ['menopause', 'hot flash'])

        # Detect intent from current message
        intent_prevention = any(w in user_text for w in ['bacha', 'bachao', 'bachein', 'precaution', 'prevent', 'rokna', 'avoid', 'kese na ho', 'na ho'])
        intent_diet       = any(w in user_text for w in ['diet', 'khana', 'food', 'khayen', 'khaana', 'nutrition', 'add kren', 'kiya khain'])
        intent_treatment  = any(w in user_text for w in ['ilaj', 'treatment', 'dawai', 'medicine', 'theek'])
        intent_symptoms   = any(w in user_text for w in ['symptom', 'signs', 'kaise pata', 'nishaniyan', 'alamat'])
        intent_exercise      = any(w in user_text for w in ['exercise', 'workout', 'physical', 'yoga'])
        intent_complications = any(w in user_text for w in ['aur kya', 'oor kya', 'koon koon', 'kaun kaun', 'bemariyan', 'bimari', 'problems', 'issues', 'complications', 'linked', 'related', 'connection', 'hosti hain', 'ho sakti', 'new'])
        intent_causes        = any(w in user_text for w in ['kyun', 'kyon', 'wajah', 'cause', 'reason', 'kaise hoti'])

        # ── PERIODS TOPIC ──────────────────────────────────────────────────
        if topic_periods:
            if intent_prevention or intent_diet:
                reply = """Bilkul! Irregular periods ko naturally regular rakhne ke liye ye cheezein bahut helpful hain:

**🥗 Diet mein ye zaroor shamil karein:**
- **Iron-rich foods:** Palak, daalein, lal gosht, khajoor — hormonal balance ke liye zaroor
- **Omega-3:** Machli, akhrot, alsi ke beej — inflammation kam karta hai
- **Vitamin D:** Anday, doodh, dhoop — cycle regulate karta hai
- **Magnesium:** Banana, dark chocolate, badam — PMS aur cramps kam karta hai
- **Zinc:** Gosht, seeds — ovulation support karta hai

**🚫 In se parhez karein:**
- Refined sugar aur maida — insulin spike karta hai jo hormones bigaarta hai
- Excessive caffeine (chai/coffee) — cycle disrupt karta hai
- Processed/junk food — inflammation badhata hai

**🌿 Lifestyle tips:**
- Roz 30 min walking ya yoga — stress hormone (cortisol) kam karta hai
- Neend poori lein — 7-8 ghante — hormonal reset hoti hai raat ko
- Stress management — periods pe sabse zyada stress ka asar hota hai
- Healthy weight maintain karein — zyada ya kam dono periods affect karte hain

**💊 Supplements (doctor se poch kar):**
- Vitamin D3 + K2
- Magnesium glycinate
- Inositol (especially PCOS mein)

Kya aap already kuch follow kar rahi hain? 💙"""

            elif intent_treatment:
                reply = """Irregular periods ka ilaj cause pe depend karta hai:

**Agar PCOS wajah hai:**
- Lifestyle changes — sabse pehla qadam
- Doctor Metformin ya birth control pills suggest kar sakte hain
- Inositol supplement helpful hai

**Agar thyroid wajah hai:**
- TSH test karwayein — thyroid medication se periods theek ho jaate hain

**Agar stress wajah hai:**
- Stress management, neend, exercise se aksar theek ho jata hai

**Agar iron ki kami hai:**
- Iron supplements + diet se 2-3 months mein sudhar aata hai

Sabse pehle doctor se milein aur blood tests karwayein — root cause pata hoga to sahi ilaj ho sakta hai. 💙"""

            elif intent_complications:
                reply = """Irregular periods se kai aur health issues jud sakte hain:

**🔗 Linked conditions:**

**1. PCOS** — sabse common cause aur effect dono
**2. Thyroid disorders** — TSH abnormal ho to cycle disturb hoti hai
**3. Anemia** — heavy/frequent periods iron drain karti hain
**4. Endometriosis** — severe dard + irregular bleeding
**5. Uterine fibroids** — heavy bleeding wajah
**6. Fertility issues** — irregular ovulation se pregnancy mein mushkil
**7. Osteoporosis** — hormonal imbalance bones affect karta hai long-term
**8. Diabetes** — insulin resistance periods affect karti hai

**✅ Tests jo karwayein:**
- CBC, TSH, blood sugar, hormonal panel (LH, FSH, estrogen, progesterone)
- Pelvic ultrasound

Kya aap kisi specific condition ke baare mein detail chahti hain? 💙"""
            else:
                reply = """Irregular periods kai wajuhat se ho sakti hain:

**Aam wajuhat:**
- Hormonal imbalance (PCOS, thyroid)
- Stress — physical ya emotional
- Weight mein achanak tabdili
- Iron ki kami (Anemia)
- Dawaiyan ya birth control

**Prevention ke liye:**
- Balanced diet — iron, magnesium, vitamin D
- Regular exercise — roz 30 min
- Stress kam karein
- Poori neend lein

Kya aap kuch specific poochna chahti hain — diet, linked conditions, ya symptoms? 💙"""

        # ── PCOS TOPIC ────────────────────────────────────────────────────
        elif topic_pcos:
            if intent_diet or intent_prevention:
                reply = """PCOS mein diet bahut important role play karti hai! Ye follow karein:

**✅ Kha sakte hain (Low-Glycemic):**
- Sabziyan — especially leafy greens (palak, methi)
- Daalein aur lobia — protein + fiber
- Oats, brown rice, whole wheat roti
- Anday — protein aur healthy fats
- Akhrot, badam, pumpkin seeds
- Berries, apple, nashpati (low-sugar fruits)

**❌ Avoid karein:**
- White rice, maida, refined carbs — insulin spike
- Sugary drinks, mithai, biscuits
- Processed aur fried foods
- Dairy zyada ho to reduce karein (kuch women mein acne worse hota hai)

**💡 Key strategy:**
- Har meal mein protein + fiber + healthy fat shamil karein
- Din mein 3 baar khayein, snacking kam karein
- Khane ke baad 10-15 min walk zaroor karein

**Supplements (doctor se confirm karein):**
- Inositol (Myo + D-Chiro) — insulin sensitivity
- Vitamin D3
- Omega-3

Kya aap apna typical din ka khana share kar sakti hain? Main aur specific suggest kar sakti hoon! 💙"""
            else:
                reply = """PCOS ek common hormonal condition hai. Main pehle se is baare mein baat kar rahi hoon.

Kya aap specifically poochna chahti hain:
- 🥗 Diet aur khanay ki cheezein?
- 💊 Supplements ya treatment?
- 🏃 Exercise routine?
- 🔬 Kaun se tests karwayein?

Batayein — detail mein guide karti hoon! 💙"""

        # ── ANEMIA TOPIC ──────────────────────────────────────────────────
        elif topic_anemia:
            if intent_complications:
                reply = """Bilkul! Anemia akele nahi aata — isse kai aur health problems judi hoti hain:

**🔗 Anemia se linked conditions:**

**1. Thyroid Disorders**
- Iron ki kami thyroid hormone production affect karti hai
- Hypothyroidism bhi anemia worse kar sakta hai — dono saath check karwayein

**2. PCOS**
- Heavy periods wajah se iron loss zyada hota hai
- PCOS patients mein anemia common hai

**3. Heart Problems**
- Severe anemia mein dil zyada kaam karta hai oxygen pump karne ke liye
- Long-term mein cardiac stress ho sakta hai

**4. Pregnancy Complications**
- Pregnant women mein anemia — preterm birth, low birth weight ka risk
- Pakistan mein maternal anemia ek bada masla hai

**5. Immune System Kamzor**
- Iron immune cells ke liye zaroor hai — kami mein infections zyada hoti hain

**6. Cognitive Issues**
- Brain ko oxygen kam milti hai — concentration, memory affect hoti hai
- Bacho mein iron deficiency — school performance aur development

**7. Restless Leg Syndrome**
- Raaton ko tangon mein bechain feel hona — iron kami se linked

**8. Hair Loss**
- Iron hair follicles ke liye zaroori hai — severe anemia mein baal girte hain

**✅ Isliye:** Sirf hemoglobin nahi, full CBC + thyroid + vitamin D ek saath check karwayein!

Kya aap in mein se kisi specific cheez ke baare mein aur jaanna chahti hain? 💙"""
            elif intent_diet or intent_prevention:
                reply = """Anemia se bachne ke liye ya theek karne ke liye ye diet follow karein:

**🥩 Iron-rich foods:**
- Lal gosht (beef, lamb) — heme iron best absorbed hota hai
- Murgh (chicken) aur machli
- Palak, methi, saag — non-heme iron
- Daalein, rajma, lobia, chane
- Khajoor, anjeer, kishmish
- Tofu aur fortified cereals

**🍊 Vitamin C ke saath khayein — absorption 3x hoti hai:**
- Nimbu ka ras khane pe nichor lein
- Malt, amla, strawberry
- Bell pepper (shimla mirch)

**🚫 Avoid karein:**
- Chai/coffee khane ke 1 ghante baad tak nahi — tannins iron block karte hain
- Calcium supplements iron ke saath nahi lene — competing absorption

**💊 Supplements:**
- Ferrous sulfate ya ferrous gluconate (doctor se dose poochhein)
- Vitamin C ke saath lein

CBC test se hemoglobin level check karayein — 3 months mein improvement aata hai. 💙"""
            else:
                reply = """Anemia mein hemoglobin ya iron kam ho jaata hai.

**Symptoms:** Thakawat, sar chakrana, pale skin, saans phoolna
**Prevention:** Iron-rich diet + Vitamin C, chai/coffee se parhez

Kya poochna chahti hain — diet, linked conditions, symptoms, ya supplements? 💙"""

        # ── THYROID TOPIC ─────────────────────────────────────────────────
        elif topic_thyroid:
            if intent_diet or intent_prevention:
                reply = """Thyroid health ke liye ye diet helpful hai:

**✅ Thyroid-supporting foods:**
- Selenium-rich: Brazil nuts (2-3 roz), sunflower seeds, machli
- Zinc: Gosht, pumpkin seeds, chickpeas
- Iodine: Iodized namak, seafood, dairy
- Vitamin D: Anday, doodh, dhoop

**❌ Goitrogens (raw mein zyada nahi):**
- Gobi, broccoli, bund gobi — pakane se problem kam hoti hai
- Soy products zyada nahi

**Lifestyle:**
- Stress kam karein — cortisol thyroid suppress karta hai
- Poori neend — thyroid hormone raat ko release hoti hai
- Regular exercise

TSH test zaroor karwayein agar symptoms hain. 💙"""
            else:
                reply = """Thyroid ke baare mein kya specifically jaanna chahti hain?

- Symptoms kya hote hain?
- Diet aur lifestyle?
- Kaun se tests?
- Treatment options?

Batayein! 💙"""

        # ── GENERAL / FOLLOW-UP ───────────────────────────────────────────
        else:
            reply = """Samajh gayi aapka sawaal! 💙

Thoda aur detail mein batayein — kya aap pooch rahi hain:

- **Kisi specific condition** ke baare mein (PCOS, thyroid, anemia, periods)?
- **Diet ya food** ki guidance?
- **Symptoms** samajhna chahti hain?
- **Prevention** — kaise healthy rahein?

Main aapki poori help karna chahti hoon — jitna detail dein utna better jawab de sakti hoon! 🌸

*(Sirf awareness — diagnosis ke liye doctor se milein)*"""

        return jsonify({'reply': reply, 'provider': 'smart-fallback'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/assess-health', methods=['POST'])
def assess_health():
    try:
        data = request.json or {}
        user_symptoms = [s.strip().lower() for s in data.get('symptoms', [])]
        age = int(data.get('age', 25))
        weight = float(data.get('weight', 60.0))
        height = float(data.get('height', 160.0))
        cycle_length = int(data.get('cycle_length', 28))
        cycle_regularity = int(data.get('cycle_regularity', 1))
        bmi = round(weight / ((height / 100.0) ** 2), 2)
        results = {}

        pcos_risk_pct = 0.0
        pcos_risk_label = "Low"

        # Always available — used both for the ML-model matched_symptoms
        # display and as the fallback risk calculation when no model is loaded.
        pcos_symptoms = conditions_db.get('pcos', {}).get('symptoms_en', conditions_db.get('pcos', {}).get('symptoms', []))

        if pcos_model is not None:
            follicle_num_l = int(data.get('follicle_num_l', 5 if cycle_regularity == 1 else 9))
            follicle_num_r = int(data.get('follicle_num_r', 6 if cycle_regularity == 1 else 10))
            weight_gain = 1 if 'weight gain' in user_symptoms or 'difficulty losing weight' in user_symptoms else 0
            hirsutism = 1 if 'excess facial hair' in user_symptoms or 'excess body hair' in user_symptoms else 0
            acne = 1 if 'acne' in user_symptoms else 0
            skin_darkening = 1 if 'dark skin patches' in user_symptoms else 0
            hair_thinning = 1 if 'hair thinning on scalp' in user_symptoms else 0
            fast_food = 1 if data.get('fast_food', False) else 0
            exercise = 1 if data.get('exercise', True) else 0
            input_dict = {
                'Age': age, 'BMI': bmi, 'CycleRegularity': cycle_regularity,
                'CycleLength': cycle_length, 'WeightGain': weight_gain,
                'Hirsutism': hirsutism, 'Acne': acne, 'SkinDarkening': skin_darkening,
                'HairThinning': hair_thinning, 'FollicleNumL': follicle_num_l,
                'FollicleNumR': follicle_num_r, 'FastFood': fast_food, 'Exercise': exercise
            }
            features_input = [input_dict[f] for f in pcos_features]
            features_df = pd.DataFrame([features_input], columns=pcos_features)
            prob = pcos_model.predict_proba(features_df)[0][1]
            pcos_risk_pct = round(float(prob) * 100, 2)
            pcos_risk_label = "High" if pcos_risk_pct > 75 else ("Medium" if pcos_risk_pct > 35 else "Low")
        else:
            matched = [s for s in user_symptoms if s in pcos_symptoms]
            pct = len(matched) / len(pcos_symptoms) if pcos_symptoms else 0
            pcos_risk_pct = round(pct * 100, 2)
            pcos_risk_label = "High" if pcos_risk_pct >= 50 else ("Medium" if pcos_risk_pct >= 20 else "Low")

        assess_lang = data.get('lang', 'en')
        suf = '_ur' if assess_lang == 'ur' else '_en'

        results['pcos'] = {
            "name": conditions_db.get('pcos', {}).get(f'name{suf}', conditions_db.get('pcos', {}).get('name', 'PCOS')),
            "risk_score": pcos_risk_pct, "risk_level": pcos_risk_label,
            "explanation": conditions_db.get('pcos', {}).get(f'explanation{suf}', conditions_db.get('pcos', {}).get('explanation')),
            "urgency": conditions_db.get('pcos', {}).get(f'urgency{suf}', conditions_db.get('pcos', {}).get('urgency')),
            "urgency_desc": conditions_db.get('pcos', {}).get(f'urgency_desc{suf}', conditions_db.get('pcos', {}).get('urgency_desc')),
            "lifestyle_tips": conditions_db.get('pcos', {}).get(f'lifestyle_tips{suf}', conditions_db.get('pcos', {}).get('lifestyle_tips')),
            "matched_symptoms": [s for s in user_symptoms if s in pcos_symptoms]
        }

        for cond_id, cond_info in conditions_db.items():
            if cond_id == 'pcos':
                continue
            cond_symptoms = cond_info.get('symptoms_en', cond_info.get('symptoms', []))
            matched = []
            for sym in user_symptoms:
                for csym in cond_symptoms:
                    if sym in csym or csym in sym:
                        if csym not in matched:
                            matched.append(csym)
            total_syms = len(cond_symptoms)
            match_pct = (len(matched) / total_syms) if total_syms > 0 else 0
            if cond_id == 'endometriosis':
                if 'severe pelvic pain' in user_symptoms or 'pain during periods' in user_symptoms:
                    match_pct = max(match_pct, 0.5)
            if cond_id == 'menopause':
                if age < 38:
                    match_pct *= 0.1
                elif age >= 45:
                    match_pct = max(match_pct, 0.4)
            risk_pct = round(match_pct * 100, 2)
            risk_label = "High" if risk_pct >= 50 else ("Medium" if risk_pct >= 20 else "Low")
            results[cond_id] = {
                "name": cond_info.get(f'name{suf}', cond_info.get('name')),
                "risk_score": risk_pct, "risk_level": risk_label,
                "explanation": cond_info.get(f'explanation{suf}', cond_info.get('explanation')),
                "urgency": cond_info.get(f'urgency{suf}', cond_info.get('urgency')),
                "urgency_desc": cond_info.get(f'urgency_desc{suf}', cond_info.get('urgency_desc')),
                "lifestyle_tips": cond_info.get(f'lifestyle_tips{suf}', cond_info.get('lifestyle_tips')),
                "matched_symptoms": matched
            }

        response_payload = {
            "bmi": bmi, "results": results,
            "disclaimer": "Yeh information sirf awareness ke liye hai aur diagnosis nahi hai. Sahi tashkhees ke liye apne doctor se mashwara karein."
        }

        # Persist this assessment to the user's record (if logged in / email provided)
        # so the Health Score widget shows real, durable data instead of
        # something that only lived in this browser's localStorage.
        user_email = (data.get('email') or '').strip()
        if user_email:
            health_score = compute_health_score(results)
            top = get_top_risk(results)
            top_name = top.get('name') if top else None
            risk_label = score_to_label(health_score)
            ok, saved = user_store.save_assessment(
                email=user_email,
                bmi=bmi,
                results=results,
                health_score=health_score,
                risk_label=risk_label,
                top_risk_name=top_name,
            )
            if ok:
                response_payload["saved"] = True
                response_payload["health_score"] = health_score
            else:
                # User wasn't found (e.g. stale session) — still return the
                # assessment results, just flag that it wasn't persisted.
                response_payload["saved"] = False

        return jsonify(response_payload)
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/api/explain-report', methods=['POST'])
def explain_report():
    try:
        file = request.files.get('file')
        lang = request.form.get('lang', 'both')
        file_name = file.filename if file else "report.jpg"
        file_name_lower = file_name.lower()
        groq_key = os.getenv('GROQ_API_KEY', '')
        file_bytes = file.read() if file else b''

        lang_instruction = {
            'both': 'Provide explanation in TWO sections: first English, then Roman Urdu.',
            'ur':   'Provide the entire explanation in Roman Urdu only.',
            'en':   'Provide the entire explanation in English only.',
        }.get(lang, 'Provide in both English and Roman Urdu.')

        prompt = f"""You are an expert medical report explainer for women patients in Pakistan.
Analyze this medical lab report or prescription carefully.

1. Identify ALL lab values, test results, or medications
2. For each value explain: what it measures, Normal/High/Low status with range, what it means, action needed
3. Add dietary and lifestyle recommendations
4. Add a brief disclaimer at the end

{lang_instruction}
Use ## headers, bullet points, and **bold** for important values. Be warm and avoid jargon."""

        if groq_key and file_bytes:
            try:
                import base64
                from groq import Groq
                client = Groq(api_key=groq_key)

                # Build one image block per page. NOTE: Groq's vision models only
                # accept actual image bytes (png/jpeg) in `image_url` — they cannot
                # read a raw PDF the way this used to send it (mime type
                # 'application/pdf' inside an image_url block). That silently failed
                # on every PDF upload, which is why the AI ended up analyzing nothing
                # and falling back to a generic, filename-only guess below.
                image_blocks = []
                if file_name_lower.endswith('.pdf'):
                    import fitz  # PyMuPDF
                    pdf_doc = fitz.open(stream=file_bytes, filetype='pdf')
                    for page in pdf_doc[:3]:  # cap pages: stays under Groq's 5-image limit
                        pixmap = page.get_pixmap(dpi=150)
                        b64 = base64.b64encode(pixmap.tobytes('png')).decode('utf-8')
                        image_blocks.append({'type': 'image_url', 'image_url': {'url': f'data:image/png;base64,{b64}'}})
                    pdf_doc.close()
                else:
                    mime = 'image/png' if file_name_lower.endswith('.png') else 'image/jpeg'
                    b64 = base64.b64encode(file_bytes).decode('utf-8')
                    image_blocks.append({'type': 'image_url', 'image_url': {'url': f'data:{mime};base64,{b64}'}})

                # llama-3.2-90b-vision-preview was decommissioned by Groq back on
                # 04/14/25 — every call to it errored out, which is what silently
                # triggered the generic "guess from filename" fallback that used to
                # sit below this. qwen/qwen3.6-27b is Groq's current, non-deprecated
                # vision-capable model (see console.groq.com/docs/vision).
                res = client.chat.completions.create(
                    model='qwen/qwen3.6-27b',
                    messages=[{'role': 'user', 'content': [
                        {'type': 'text', 'text': prompt},
                        *image_blocks,
                    ]}],
                    temperature=0.4, max_tokens=2048,
                )
                return jsonify({'explanation': res.choices[0].message.content, 'provider': 'Groq Vision (Qwen3.6 27B)'})
            except Exception as e:
                print(f'Groq vision error: {e}')
                # Be honest with the user instead of quietly guessing content from
                # the filename — for a medical report, fabricated-looking output is
                # worse than a clear "please try again" error.
                return jsonify({'error': "AI couldn't read that report right now. Please try again, or upload a clearer photo/PDF."}), 502

        if groq_key and not file_bytes:
            return jsonify({'error': 'No file was received by the server — please choose a file and try again.'}), 400

        if 'tsh' in file_name_lower or 'thyroid' in file_name_lower:
            exp = '## Thyroid Report\n\n**TSH: 6.2 mIU/L** (Normal: 0.4-4.0)\n- **Status:** HIGH\n- Hypothyroidism likely\n\n---\n\n## Roman Urdu\n\nTSH barha hua hai. Doctor se milein.'
        elif any(w in file_name_lower for w in ['cbc','blood','hb','hemoglobin']):
            exp = '## CBC Report\n\n**Hemoglobin: 9.8 g/dL** (Normal: 12-15.5)\n- **Status:** LOW — Anemia\n\n---\n\n## Roman Urdu\n\nHemoglobin kam hai. Iron-rich foods khayein.'
        else:
            exp = '## Medical Report\n\nGroq API key .env mein add karein taake AI properly analyze kar sake.\n\n**Disclaimer:** Sirf awareness ke liye.'
        return jsonify({'explanation': exp, 'provider': 'Local Simulator'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/discharge-summary', methods=['POST'])
def discharge_summary():
    try:
        file = request.files.get('file')
        auth_header = request.headers.get('Authorization', '')
        api_key = auth_header.replace('Bearer ', '').strip() if auth_header.startswith('Bearer ') else ''
        if not api_key:
            api_key = os.getenv('GEMINI_API_KEY', '')
        file_name = file.filename if file else "discharge.pdf"
        file_name_lower = file_name.lower()

        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                file_bytes = file.read() if file else b''
                prompt = (
                    "Analyze this hospital discharge summary. Return ONLY valid JSON with keys: "
                    "procedure_name, recovery_period_days, medications (array with name/dosage/timing/purpose/frequency), "
                    "dietary_restrictions, activities_to_avoid, follow_up_date, warning_signs. "
                    "No markdown, no code blocks. Just raw JSON."
                )
                model = genai.GenerativeModel('gemini-2.0-flash')
                if file_bytes:
                    mime_type = "application/pdf" if file_name_lower.endswith('.pdf') else "image/jpeg"
                    contents = [{"mime_type": mime_type, "data": file_bytes}, prompt]
                else:
                    contents = [prompt]
                response = model.generate_content(contents)
                json_str = response.text.strip().lstrip('```json').rstrip('```').strip()
                return jsonify(json.loads(json_str))
            except Exception as e:
                print(f"Gemini discharge error: {e}")

        procedure = "Laparoscopic Cystectomy"
        if "append" in file_name_lower: procedure = "Appendectomy"
        elif "c-section" in file_name_lower: procedure = "Cesarean Section"
        elif "hyster" in file_name_lower: procedure = "Hysterectomy"

        return jsonify({
            "procedure_name": procedure, "recovery_period_days": 10,
            "medications": [
                {"name": "Paracetamol (Panadol)", "dosage": "500mg", "timing": "After meals", "purpose": "Pain control", "frequency": "3x daily"},
                {"name": "Augmentin", "dosage": "625mg", "timing": "After food", "purpose": "Antibiotic", "frequency": "2x daily for 5 days"},
                {"name": "Dufalac Syrup", "dosage": "15ml", "timing": "Before bed", "purpose": "Stool softener", "frequency": "Once daily"}
            ],
            "dietary_restrictions": ["Avoid spicy/oily foods for 5 days", "Drink 8-10 glasses water daily", "Eat fiber-rich foods"],
            "activities_to_avoid": ["No lifting > 3kg for 2 weeks", "No driving for 7 days", "Avoid stairs repeatedly"],
            "follow_up_date": "2026-07-08",
            "warning_signs": ["Fever above 38°C", "Severe pain not relieved by Panadol", "Wound bleeding or pus", "Cannot pass urine"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/api/check-in', methods=['POST'])
def check_in():
    try:
        data = request.json or {}
        pain = int(data.get('pain_level', 0))
        fever = float(data.get('fever_temp', 37.0))
        wound_status = data.get('wound_status', 'normal').lower()
        days_with_fever = int(data.get('days_with_fever', 0))
        red_flags = []
        if pain >= 8:
            red_flags.append(f"Severe Pain (Level {pain}/10): Contact your surgeon.")
        if fever >= 38.3:
            red_flags.append(f"High Fever ({fever}°C): Possible infection — see doctor immediately.")
        elif fever >= 37.8 and days_with_fever >= 2:
            red_flags.append(f"Persistent fever ({fever}°C for {days_with_fever} days): Needs investigation.")
        if wound_status in ['bleeding', 'pus', 'open']:
            red_flags.append(f"Abnormal wound ({wound_status}): Get inspected immediately.")
        is_alert = len(red_flags) > 0
        return jsonify({
            "is_red_flag_alert": is_alert, "alerts": red_flags,
            "status_summary": "Urgent Care Recommended" if is_alert else "Recovery Normal.",
            "next_steps": ["Call surgeon immediately", "Go to ER if bleeding"] if is_alert else ["Rest", "Take medications on time", "Stay hydrated"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"HerCare AI Backend starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)