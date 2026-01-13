import sys
import os
import face_recognition
import numpy as np
import json
from PIL import Image
from datetime import datetime
import psycopg2

if len(sys.argv) != 2:
    print("Usage: python take_attendance.py <image_path>")
    sys.exit(1)

image_path = sys.argv[1]
print(f"Taking attendance from image: {image_path}")

# Load image
pil_image = Image.open(image_path).convert("RGB")
image_rgb = np.array(pil_image, dtype=np.uint8)

# Load encodings
enc_dir = os.path.join("python", "encodings")
if not os.path.exists(enc_dir):
    print("Error: No registered employees found")
    sys.exit(1)

enc_files = [f for f in os.listdir(enc_dir) if f.endswith(".npy")]
known_encodings = []
emp_ids = []

for file in enc_files:
    emp_ids.append(file.replace(".npy", ""))
    known_encodings.append(np.load(os.path.join(enc_dir, file)))

# Load names
with open(os.path.join(enc_dir, "names.json"), "r") as f:
    names_map = json.load(f)

# Detect faces
face_locations = face_recognition.face_locations(image_rgb, model="hog")
faces = face_recognition.face_encodings(image_rgb, face_locations)

print("Faces detected:", len(face_locations))

if len(faces) == 0:
    print("No faces detected")
    sys.exit(1)

# Connect to DB
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
except Exception as e:
    print("DB CONNECTION ERROR:", e)
    sys.exit(1)

# Loop over detected faces
attendance_marked = False

for face in faces:
    matches = face_recognition.compare_faces(known_encodings, face, tolerance=0.5)
    if True in matches:
        idx = matches.index(True)
        emp_id = emp_ids[idx]
        emp_name = names_map.get(emp_id, "Unknown")
        location = "Office Entrance"

        try:
            cur.execute("""
                INSERT INTO attendance (
                    emp_id, emp_name, attendance_date, attendance_time, location
                )
                VALUES (%s, %s, CURRENT_DATE, CURRENT_TIME, %s)
            """, (emp_id, emp_name, location))
            conn.commit()
            print(f"Attendance marked for {emp_name} ({emp_id})")
            attendance_marked = True
        except Exception as e:
            print("DB INSERT ERROR:", e)
    else:
        print("Unknown face detected")

cur.close()
conn.close()

if not attendance_marked:
    print("No known faces marked for attendance")
