# python/register_face.py
import sys
import cv2
import face_recognition
import numpy as np
import os

# Arguments: emp_id, emp_name, image_path
if len(sys.argv) != 4:
    print("Usage: python register_face.py <emp_id> <emp_name> <image_path>")
    sys.exit(1)

emp_id = sys.argv[1]
emp_name = sys.argv[2]
image_path = sys.argv[3]

print(f"Registering Employee: {emp_id}, {emp_name}")
print(f"Reading image: {image_path}")

# Windows-safe image read
image = cv2.imdecode(np.fromfile(image_path, dtype=np.uint8), cv2.IMREAD_COLOR)

if image is None:
    print("Error: Failed to read image. Check path or file type.")
    sys.exit(1)

# Convert BGR -> RGB
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# Detect face encodings
encodings = face_recognition.face_encodings(image_rgb)
if len(encodings) == 0:
    print("Error: No faces detected!")
    sys.exit(1)

# Save encoding for future attendance (as .npy file)
enc_dir = os.path.join("python", "encodings")
os.makedirs(enc_dir, exist_ok=True)
encoding_file = os.path.join(enc_dir, f"{emp_id}.npy")
np.save(encoding_file, encodings[0])

print(f"Employee {emp_name} registered successfully! Encoding saved at {encoding_file}")
