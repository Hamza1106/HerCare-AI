"""
user_store.py — Simple JSON-file-backed user storage for HerCare AI.

Stores users (name, email, password, signup date) plus each user's most
recent health assessment (BMI, full results, computed health score,
risk label, timestamp) so the data survives across browsers/devices and
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
            "last_assessment": None,  # filled in by save_assessment()
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
    Persist a user's latest health assessment to disk so it survives
    across browsers/devices/cache-clears. Overwrites any previous
    assessment — only the most recent one is kept (matches the old
    localStorage 'last_assessment' behavior).
    """
    email = email.strip().lower()
    with _lock:
        users = _read_all()
        if email not in users:
            return False, "User not found."

        import time
        users[email]["last_assessment"] = {
            "bmi": bmi,
            "results": results,
            "health_score": health_score,
            "risk_label": risk_label,
            "top_risk_name": top_risk_name,
            "timestamp": int(time.time() * 1000),
        }
        _write_all(users)
        return True, users[email]["last_assessment"]


def get_assessment(email):
    """Return this user's last_assessment dict, or None."""
    user = get_user(email)
    if not user:
        return None
    return user.get("last_assessment")


def public_user(user):
    """Strip the password out before sending a user record to the frontend."""
    if not user:
        return None
    return {
        "name": user.get("name"),
        "email": user.get("email"),
        "created_at": user.get("created_at"),
        "last_assessment": user.get("last_assessment"),
    }