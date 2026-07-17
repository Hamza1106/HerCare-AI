"""
migrate_json_to_mongo.py — ONE-TIME script.

Copies your existing back/data/users.json (the 6 users currently baked
into your repo, including real assessment history like ridaayaz1810@
gmail.com and hamzaqureshi0128@gmail.com) into MongoDB Atlas, so that
data isn't lost when you switch user_store.py over to Mongo.

Run this ONCE, locally, from the back/ folder, after:
  1. Setting MONGODB_URI in back/.env (same value you'll put on Render)
  2. pip install pymongo[srv] python-dotenv --break-system-packages

Usage:
  python migrate_json_to_mongo.py
"""

import os
import json
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")
if not MONGODB_URI:
    raise RuntimeError("Set MONGODB_URI in back/.env before running this script.")

MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "hercare")
USERS_JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "users.json")

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]
users_coll = db["users"]

with open(USERS_JSON_PATH, "r", encoding="utf-8") as f:
    users = json.load(f)

migrated, skipped = 0, 0
for email, record in users.items():
    email = email.strip().lower()

    # Old-format records stored a single "last_assessment" instead of a
    # list — normalize to the "assessments" list shape the new code expects.
    assessments = record.get("assessments")
    if assessments is None:
        old = record.get("last_assessment")
        assessments = [old] if old else []

    doc = {
        "_id": email,
        "name": record.get("name"),
        "email": email,
        "password": record.get("password"),
        "created_at": record.get("created_at"),
        "assessments": assessments,
    }
    if record.get("recovery"):
        doc["recovery"] = record["recovery"]

    result = users_coll.update_one({"_id": email}, {"$set": doc}, upsert=True)
    if result.upserted_id is not None or result.modified_count > 0:
        migrated += 1
        print(f"  migrated: {email} ({len(assessments)} assessment(s))")
    else:
        skipped += 1
        print(f"  unchanged (already up to date): {email}")

print(f"\nDone. {migrated} user(s) written, {skipped} unchanged. Total in file: {len(users)}.")
