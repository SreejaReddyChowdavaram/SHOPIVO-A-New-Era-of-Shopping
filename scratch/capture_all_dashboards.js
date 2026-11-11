const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA_DIR = path.join(__dirname, 'chrome_dash_' + Date.now());
const PORT = 9223; // Use 9223 to avoid conflict with any other instances
const ARTIFACT_DIR = "C:\\Users\\SREEJA\\.gemini\\antigravity\\brain\\61bb6741-0cd9-4228-8598-484b7f0b2add";

async function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function capture() {
  console.log('Spawning Chrome on port', PORT);
  const chrome = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let targets = null;
  for (let i = 0; i < 30; i++) {
    await wait(300);
    try {
      targets = await getJson(`http://127.0.0.1:${PORT}/json`);
      if (targets && targets.length > 0) break;
    } catch (e) {}
  }

  if (!targets || targets.length === 0) {
    console.error('Failed to get CDP targets');
    chrome.kill();
    return;
  }

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  await new Promise((res) => (ws.onopen = res));

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const roles = [
    {
      name: 'customer',
      role: 'CUSTOMER',
      path: '/customer/dashboard',
      user: { id: 1, firstName: 'Sreeja', lastName: 'Reddy', email: 'customer@shopivo.com', role: 'CUSTOMER' },
      lightFile: 'customer_dashboard_light.png',
      darkFile: 'customer_dashboard_dark.png',
    },
    {
      name: 'seller',
      role: 'SELLER',
      path: '/seller/dashboard',
      user: { id: 2, firstName: 'Apex', lastName: 'Electronics', email: 'seller@shopivo.com', role: 'SELLER' },
      lightFile: 'seller_dashboard_light.png',
      darkFile: 'seller_dashboard_dark.png',
    },
    {
      name: 'admin',
      role: 'ADMIN',
      path: '/admin/dashboard',
      user: { id: 3, firstName: 'Admin', lastName: 'Director', email: 'admin@shopivo.com', role: 'ADMIN' },
      lightFile: 'admin_dashboard_light.png',
      darkFile: 'admin_dashboard_dark.png',
    },
  ];

  for (const item of roles) {
    console.log(`\n=== Processing ${item.name.toUpperCase()} Dashboard ===`);

    // 1. First visit root to set localStorage with light theme
    await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
    await wait(1000);

    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('sc_access_token', 'mock_jwt_token_for_dashboard_preview');
        localStorage.setItem('sc_user', JSON.stringify(${JSON.stringify(item.user)}));
        localStorage.setItem('secure-ai-theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
      `
    });

    // Navigate to target path
    console.log(`Navigating to ${item.path} (Light Mode)...`);
    await send('Page.navigate', { url: `http://127.0.0.1:5173${item.path}` });
    await wait(2500);

    // Capture Light screenshot
    const shotLight = await send('Page.captureScreenshot', { format: 'png' });
    const bufferLight = Buffer.from(shotLight.result.data, 'base64');
    const lightPath = path.join(ARTIFACT_DIR, item.lightFile);
    fs.writeFileSync(lightPath, bufferLight);
    console.log(`Saved: ${item.lightFile} (${bufferLight.length} bytes)`);

    // Switch to Dark Mode in DOM and localStorage
    console.log(`Switching to Dark Mode on ${item.path}...`);
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('secure-ai-theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      `
    });
    await wait(1500);

    // Capture Dark screenshot
    const shotDark = await send('Page.captureScreenshot', { format: 'png' });
    const bufferDark = Buffer.from(shotDark.result.data, 'base64');
    const darkPath = path.join(ARTIFACT_DIR, item.darkFile);
    fs.writeFileSync(darkPath, bufferDark);
    console.log(`Saved: ${item.darkFile} (${bufferDark.length} bytes)`);
  }

  ws.close();
  chrome.kill();
  console.log('\nAll 6 dashboard screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});

