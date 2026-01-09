document.addEventListener('DOMContentLoaded', () => {
  startCamera();

  const registerBtn = document.getElementById('registerBtn');
  const attendanceBtn = document.getElementById('attendanceBtn');

  registerBtn.addEventListener('click', registerEmployee);
  attendanceBtn.addEventListener('click', markAttendance);

  loadAttendanceTable();
});

async function startCamera() {
  const video = document.getElementById('videoElement');
  const registerBtn = document.getElementById('registerBtn');
  const attendanceBtn = document.getElementById('attendanceBtn');

  registerBtn.disabled = true;
  attendanceBtn.disabled = true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await video.play();

    registerBtn.disabled = false;
    attendanceBtn.disabled = false;
  } catch (err) {
    console.error('Camera permission error:', err);
    alert('Please allow camera access to use this app.');
  }
}

function captureFrame(videoElement) {
  if (!videoElement.videoWidth || !videoElement.videoHeight) return null;

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/jpeg'));
}

async function registerEmployee() {
  const video = document.getElementById('videoElement');
  const empId = document.getElementById('emp_id').value.trim();
  const empName = document.getElementById('emp_name').value.trim();

  if (!empId || !empName) {
    alert('Please enter Employee ID and Name.');
    return;
  }

  const imageBlob = await captureFrame(video);
  if (!imageBlob) { alert('Video not ready yet'); return; }

  const formData = new FormData();
  formData.append('emp_id', empId);
  formData.append('emp_name', empName);
  formData.append('image', imageBlob, 'face.jpg');

  try {
    const res = await fetch('/register', { method: 'POST', body: formData });
    const text = await res.text();
    alert('Registration Result: ' + text);
  } catch (err) {
    console.error('Registration error:', err);
    alert('Error registering employee.');
  }
}

async function markAttendance() {
  const video = document.getElementById('videoElement');
  const imageBlob = await captureFrame(video);
  if (!imageBlob) { alert('Video not ready yet'); return; }

  const formData = new FormData();
  formData.append('image', imageBlob, 'face.jpg');

  try {
    const res = await fetch('/attendance', { method: 'POST', body: formData });
    const text = await res.text();
    alert('Attendance Result: ' + text);
    loadAttendanceTable();
  } catch (err) {
    console.error('Attendance error:', err);
    alert('Error taking attendance.');
  }
}

async function loadAttendanceTable() {
  try {
    const res = await fetch('/attendance');
    const data = await res.json();

    const tableBody = document.getElementById('attendanceTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.emp_id}</td>
        <td>${row.emp_name}</td>
        <td>${row.attendance_date}</td>
        <td>${row.attendance_time}</td>
        <td>${row.location || ''}</td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading table:', err);
  }
}
