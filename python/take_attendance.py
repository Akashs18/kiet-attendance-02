# python/take_attendance.py
import sys
import cv2
import face_recognition
import numpy as np
import os
from datetime import datetime

if len(sys.argv) != 2:
    print("Usage: python take_attendance.py <image_path>")
    sys.exit(1)

image_path = sys.argv[1]
print(f"Taking attendance from image: {image_path}")

# Windows-safe image read
image = cv2.imdecode(np.fromfile(image_path, dtype=np.uint8), cv2.IMREAD_COLOR)
if image is None:
    print("Error: Failed to read image")
    sys.exit(1)

# Convert BGR -> RGB
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# Load all registered encodings
enc_dir = os.path.join("python", "encodings")
if not os.path.exists(enc_dir):
    print("Error: No registered employees found")
    sys.exit(1)

encodings_files = [f for f in os.listdir(enc_dir) if f.endswith(".npy")]
known_encodings = []
emp_ids = []

for file in encodings_files:
    emp_id = file.replace(".npy", "")
    encoding = np.load(os.path.join(enc_dir, file))
    known_encodings.append(encoding)
    emp_ids.append(emp_id)

# Detect faces in the image
faces = face_recognition.face_encodings(image_rgb)
if len(faces) == 0:
    print("No faces detected in the image")
    sys.exit(1)

# Compare detected faces to known encodings
for face in faces:
    matches = face_recognition.compare_faces(known_encodings, face, tolerance=0.5)
    if True in matches:
        idx = matches.index(True)
        emp_id = emp_ids[idx]
        # For demo purposes, we just print
        print(f"Attendance marked for Employee ID: {emp_id} at {datetime.now()}")
    else:
        print("Unknown face detected")
