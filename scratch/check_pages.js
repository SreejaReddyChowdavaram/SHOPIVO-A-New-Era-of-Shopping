const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA_DIR = path.join(__dirname, 'chrome_check_' + Date.now());
const PORT = 9227;

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

async function check() {
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

  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await wait(1000);

  // Set SELLER
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('sc_access_token', 'mock_token');
      localStorage.setItem('sc_user', JSON.stringify({ id: 2, firstName: 'Apex', lastName: 'Store', email: 'seller@shopivo.com', role: 'SELLER' }));
    `
  });
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/seller/dashboard' });
  await wait(3000);

  const sellerHtml = await send('Runtime.evaluate', {
    expression: `document.getElementById('root')?.innerHTML.slice(0, 1000)`,
    returnByValue: true
  });
  console.log('Seller HTML:', sellerHtml.result.result.value);

  // Set ADMIN
  await send('Runtime.evaluate', {
    expression: `
      localStorage.setItem('sc_access_token', 'mock_token');
      localStorage.setItem('sc_user', JSON.stringify({ id: 3, firstName: 'Admin', lastName: 'Boss', email: 'admin@shopivo.com', role: 'ADMIN' }));
    `
  });
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/admin/dashboard' });
  await wait(3000);

  const adminHtml = await send('Runtime.evaluate', {
    expression: `document.getElementById('root')?.innerHTML.slice(0, 1000)`,
    returnByValue: true
  });
  console.log('Admin HTML:', adminHtml.result.result.value);

  ws.close();
  chrome.kill();
}

check();
