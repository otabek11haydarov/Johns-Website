import { spawn } from 'child_process';
import http from 'http';

function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

console.log("Starting Johns Website Driver...");

// Launch backend
const backend = spawn('npm', ['start'], {
  cwd: './backend',
  shell: true,
  stdio: 'inherit'
});

// Launch frontend
const frontend = spawn('npx', ['-y', 'http-server', 'frontend', '-p', '3000'], {
  cwd: '.',
  shell: true,
  stdio: 'inherit'
});

// Wait and verify
setTimeout(async () => {
  const backendOk = await checkUrl('http://localhost:5500');
  const frontendOk = await checkUrl('http://localhost:3000');

  console.log(`Backend status (port 5500): ${backendOk ? "ONLINE" : "OFFLINE"}`);
  console.log(`Frontend status (port 3000): ${frontendOk ? "ONLINE" : "OFFLINE"}`);

  if (backendOk && frontendOk) {
    console.log("All systems are operational! Verification successful.");
    process.exit(0);
  } else {
    console.error("System verification failed. One or more servers are offline.");
    process.exit(1);
  }
}, 5000);
