"""
user_store.py — Simple JSON-file-backed user storage for HerCare AI.

Stores users (name, email, password, signup date) plus each user's
health assessment history (a capped list of past BMI/results/health
score/risk snapshots) so the data survives across browsers/devices and
isn't lost when localStorage is cleared.

This is intentionally simple (a single JSON file + a lock) because the
expected user count is small. If this app ever needs to scale to many
concurrent users, swap this module out for a real database — the
function signatures below (get_user, create_user, verify_login,
save_assessment) are the only things that would need to change.
"""

import os
import json
import threading

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USERS_PATH = os.path.join(BASE_DIR, "data", "users.json")

# How many past assessments to keep per user (oldest are dropped once
# this cap is hit, so the JSON file doesn't grow unbounded over time).
MAX_ASSESSMENT_HISTORY = 50

# In-process lock — prevents two simultaneous Flask requests (threads)
# from reading + writing the file at the same time and corrupting it.
# (Flask's dev server is multi-threaded by default.)
_lock = threading.Lock()


def _ensure_file():
    os.makedirs(os.path.dirname(USERS_PATH), exist_ok=True)
    if not os.path.exists(USERS_PATH):
        with open(USERS_PATH, "w", encoding="utf-8") as f:
            json.dump({}, f)


def _read_all():
    _ensure_file()
    try:
        with open(USERS_PATH, "r", encoding="utf-8") as f:
            content = f.read().strip()
            return json.loads(content) if content else {}
    except (json.JSONDecodeError, FileNotFoundError):
        return {}


def _write_all(users):
    _ensure_file()
    # Write to a temp file then rename — avoids leaving a half-written,
    # corrupted users.json if the process is killed mid-write.
    tmp_path = USERS_PATH + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2, ensure_ascii=False)
    os.replace(tmp_path, USERS_PATH)


def get_user(email):
    """Return the user record dict for this email, or None."""
    if not email:
        return None
    email = email.strip().lower()
    with _lock:
        users = _read_all()
        return users.get(email)


def email_exists(email):
    return get_user(email) is not None


def create_user(name, email, password):
    """
    Create a new user record. Returns (success, user_dict_or_error_message).
    NOTE: passwords are stored as plain text here, matching what the
    previous localStorage-based auth did. This is fine for a hackathon /
    student-submission demo but should NOT be used in production —
    if this app is ever exposed publicly, hash passwords (e.g. with
    werkzeug.security.generate_password_hash) before storing them.
    """
    email = email.strip().lower()
    with _lock:
        users = _read_all()
        if email in users:
            return False, "An account with this email already exists."

        import time
        users[email] = {
            "name": name.strip(),
            "email": email,
            "password": password,
            "created_at": int(time.time() * 1000),
            "assessments": [],  # appended to by save_assessment()
        }
        _write_all(users)
        return True, users[email]


def verify_login(email, password):
    """Return (success, user_dict_or_error_message)."""
    email = email.strip().lower()
    with _lock:
        users = _read_all()
        user = users.get(email)
        if not user or user.get("password") != password:
            return False, "Incorrect email or password."
        return True, user


def save_assessment(email, bmi, results, health_score, risk_label, top_risk_name):
    """
    Persist a health assessment to the user's history so it survives
    across browsers/devices/cache-clears. Appends to a capped list
    (MAX_ASSESSMENT_HISTORY entries) instead of overwriting, so past
    assessments are kept for trend-tracking rather than only the most
    recent one.
    """
    email = email.strip().lower()
    with _lock:
        users = _read_all()
        if email not in users:
            return False, "User not found."

        import time
        entry = {
            "bmi": bmi,
            "results": results,
            "health_score": health_score,
            "risk_label": risk_label,
            "top_risk_name": top_risk_name,
            "timestamp": int(time.time() * 1000),
        }

        # Migrate old-format records (single "last_assessment" dict) the
        # first time we touch them, so history isn't silently lost.
        if "assessments" not in users[email]:
            old = users[email].pop("last_assessment", None)
            users[email]["assessments"] = [old] if old else []

        users[email]["assessments"].append(entry)
        # Keep only the most recent N entries so the file doesn't grow forever.
        users[email]["assessments"] = users[email]["assessments"][-MAX_ASSESSMENT_HISTORY:]

        _write_all(users)
        return True, entry


def save_recovery(email, plan):
    """
    Persist the user's latest discharge-summary-derived recovery plan
    (procedure, medications with reminder_times, restrictions, warning
    signs) so revisiting the Recovery Assistant shows the same plan
    instead of asking to re-upload. Overwrites any previous plan —
    a fresh checklist starts at 0% completed.
    """
    email = email.strip().lower()
    with _lock:
        users = _read_all()
        if email not in users:
            return False, "User not found."

        import time
        users[email]["recovery"] = {
            "plan": plan,
            "completed_tasks": {},
            "saved_at": int(time.time() * 1000),
        }
        _write_all(users)
        return True, users[email]["recovery"]


def get_recovery(email):
    """Return {plan, completed_tasks, saved_at} for this user, or None."""
    user = get_user(email)
    if not user:
        return None
    return user.get("recovery")


def update_recovery_tasks(email, completed_tasks):
    """Persist checklist progress (which medication doses have been marked
    taken) against the user's current recovery plan."""
    email = email.strip().lower()
    with _lock:
        users = _read_all()
        if email not in users or "recovery" not in users[email]:
            return False, "No recovery plan found for this user."
        users[email]["recovery"]["completed_tasks"] = completed_tasks
        _write_all(users)
        return True, users[email]["recovery"]


def clear_recovery(email):
    """Remove the saved recovery plan (used when the patient uploads a new
    discharge summary and wants to start fresh)."""
    email = email.strip().lower()
    with _lock:
        users = _read_all()
        if email in users and "recovery" in users[email]:
            del users[email]["recovery"]
            _write_all(users)
        return True


def get_assessment_history(email):
    """Return this user's list of past assessments (oldest -> newest), or []."""
    user = get_user(email)
    if not user:
        return []
    return user.get("assessments", [])


def get_latest_assessment(email):
    """Return this user's most recent assessment dict, or None."""
    history = get_assessment_history(email)
    return history[-1] if history else None


def public_user(user):
    """Strip the password out before sending a user record to the frontend."""
    if not user:
        return None
    # Handle any old-format records that haven't been migrated yet (only
    # happens if get_user/public_user is called before save_assessment
    # ever runs a migration for this user).
    assessments = user.get("assessments")
    if assessments is None:
        old = user.get("last_assessment")
        assessments = [old] if old else []
    return {
        "name": user.get("name"),
        "email": user.get("email"),
        "created_at": user.get("created_at"),
        "assessments": assessments,
        # Kept for backward compatibility with any code still reading
        # last_assessment directly — always the most recent entry.
        "last_assessment": assessments[-1] if assessments else None,
        # Last discharge-summary-derived recovery plan (see save_recovery),
        # or None if the user has never uploaded one / cleared it.
        "recovery": user.get("recovery"),
    }