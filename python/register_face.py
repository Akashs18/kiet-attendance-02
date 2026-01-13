import sys
import os
import face_recognition
import numpy as np
import json
import psycopg2
from PIL import Image

if len(sys.argv) != 4:
    print("Usage: python register_face.py <emp_id> <emp_name> <image_path>")
    sys.exit(1)

emp_id, emp_name, image_path = sys.argv[1:4]

# Load image
image = Image.open(image_path).convert("RGB")
image_rgb = np.array(image)

encodings = face_recognition.face_encodings(image_rgb)
if not encodings:
    print("ERROR: No face detected")
    sys.exit(1)

encoding = encodings[0]

os.makedirs("python/encodings", exist_ok=True)
np.save(f"python/encodings/{emp_id}.npy", encoding)

names_file = "python/encodings/names.json"
names = {}
if os.path.exists(names_file):
    with open(names_file) as f:
        names = json.load(f)

names[emp_id] = emp_name
with open(names_file, "w") as f:
    json.dump(names, f)

# DB insert
try:
    conn = psycopg2.connect(
        dbname="attendance_db",
        user="firstdemo_examle_user",
        password="6LBDu09slQHqq3r0GcwbY1nPera4H5Kk",
        host="dpg-d50evbfgi27c73aje1pg-a.oregon-postgres.render.com",
        port=5432,
        sslmode="require"
    )
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO employees (emp_id, emp_name)
        VALUES (%s, %s)
        ON CONFLICT (emp_id) DO NOTHING
    """, (emp_id, emp_name))

    conn.commit()
    cur.close()
    conn.close()

    print(f"SUCCESS: Employee {emp_name} registered in DB")

except Exception as e:
    print("DB ERROR:", e)
    sys.exit(1)
