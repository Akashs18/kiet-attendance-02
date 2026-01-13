document.addEventListener('DOMContentLoaded', () => {
  startCamera();

  document.getElementById('registerBtn').addEventListener('click', registerEmployee);
  document.getElementById('attendanceBtn').addEventListener('click', markAttendance);

  loadAttendanceTable();
});

async function startCamera() {
  const video = document.getElementById('videoElement');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();
  } catch (err) {
    console.error(err);
    alert('Please allow camera access');
  }
}

function captureFrame(videoElement) {
  if (!videoElement.videoWidth || !videoElement.videoHeight) return null;

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  canvas.getContext('2d').drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/jpeg'));
}

async function registerEmployee() {
  const empId = document.getElementById('emp_id').value.trim();
  const empName = document.getElementById('emp_name').value.trim();
  if (!empId || !empName) return alert('Enter ID and Name');

  const imageBlob = await captureFrame(document.getElementById('videoElement'));
  const formData = new FormData();
  formData.append('emp_id', empId);
  formData.append('emp_name', empName);
  formData.append('image', imageBlob, 'face.jpg');

  try {
    const res = await fetch('/register', { method: 'POST', body: formData });
    alert(await res.text());
  } catch (err) {
    console.error(err);
    alert('Registration failed');
  }
}

async function markAttendance() {
  const imageBlob = await captureFrame(document.getElementById('videoElement'));
  const formData = new FormData();
  formData.append('image', imageBlob, 'face.jpg');

  try {
    const res = await fetch('/attendance', { method: 'POST', body: formData });
    alert(await res.text());
    loadAttendanceTable();
  } catch (err) {
    console.error(err);
    alert('Attendance failed');
  }
}

async function loadAttendanceTable() {
  try {
    const res = await fetch('/attendance');
    const data = await res.json();
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';
    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.emp_id}</td>
        <td>${row.emp_name}</td>
        <td>${row.attendance_date}</td>
        <td>${row.attendance_time}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}
