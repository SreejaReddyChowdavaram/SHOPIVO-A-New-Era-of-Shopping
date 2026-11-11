const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA_DIR = path.join(__dirname, 'chrome_dash_cdp_' + Date.now());
const PORT = 9238;
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

const mockProducts = [
  {
    id: 101,
    title: 'Sony WH-1000XM5 Wireless Headphones',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    price: 29990,
    status: 'APPROVED',
    stockQuantity: 24,
    category: 'Electronics',
    sku: 'SNY-WH5-BLK',
    sellerName: 'Apex Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'
  },
  {
    id: 102,
    title: 'Apple MacBook Air M3 (16GB, 512GB)',
    name: 'Apple MacBook Air M3 (16GB, 512GB)',
    price: 114900,
    status: 'APPROVED',
    stockQuantity: 12,
    category: 'Computers',
    sku: 'APL-MBA-M3',
    sellerName: 'Apex Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300'
  },
  {
    id: 103,
    title: 'Mechanical Gaming Keyboard RGB',
    name: 'Mechanical Gaming Keyboard RGB',
    price: 6499,
    status: 'PENDING',
    stockQuantity: 40,
    category: 'Gaming',
    sku: 'KB-MECH-RGB',
    sellerName: 'Apex Electronics',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300'
  },
  {
    id: 104,
    title: 'Ultra-fast Wireless Charger Stand',
    name: 'Ultra-fast Wireless Charger Stand',
    price: 1999,
    status: 'REJECTED',
    stockQuantity: 0,
    category: 'Accessories',
    sku: 'CHG-WLS-15W',
    sellerName: 'Apex Electronics',
    rejectionReason: 'Product packaging image missing safety compliance marks',
    imageUrl: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=300'
  }
];

const mockOrders = [
  {
    id: 501,
    orderNumber: 'SHP-98421',
    customerName: 'Sreeja Reddy',
    status: 'CONFIRMED',
    totalAmount: 29990,
    createdAt: '2026-11-08T14:20:00Z',
    items: [{ productTitle: 'Sony WH-1000XM5', quantity: 1, unitPrice: 29990 }]
  },
  {
    id: 502,
    orderNumber: 'SHP-98420',
    customerName: 'Rahul Verma',
    status: 'SHIPPED',
    totalAmount: 6499,
    createdAt: '2026-11-08T11:05:00Z',
    items: [{ productTitle: 'Mechanical Gaming Keyboard RGB', quantity: 1, unitPrice: 6499 }]
  },
  {
    id: 503,
    orderNumber: 'SHP-98418',
    customerName: 'Priya Sharma',
    status: 'PROCESSING',
    totalAmount: 114900,
    createdAt: '2026-11-07T18:30:00Z',
    items: [{ productTitle: 'Apple MacBook Air M3', quantity: 1, unitPrice: 114900 }]
  }
];

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

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }

    if (data.method === 'Fetch.requestPaused') {
      const { requestId, request } = data.params;
      const url = request.url;
      let body = {};

      if (url.includes('/seller/products') || url.includes('/admin/products') || url.includes('/products')) {
        body = mockProducts;
      } else if (url.includes('/orders/metrics')) {
        body = { totalOrders: 1420, grossRevenue: 4520000, inFulfillment: 35, returnRate: 1.8 };
      } else if (url.includes('/users/metrics')) {
        body = { totalCustomers: 3410, totalSellers: 184, verifiedSellers: 172 };
      } else if (url.includes('/orders')) {
        body = mockOrders;
      } else if (url.includes('/analytics/summary') || url.includes('/analytics')) {
        body = {
          totalOrders: 142,
          completedOrders: 128,
          cancelledOrders: 6,
          unitsSold: 412,
          grossSales: 845200,
          grossProfit: 169040,
          averageOrderValue: 5952
        };
      } else if (url.includes('/reviews')) {
        body = { averageRating: 4.8, totalReviews: 89 };
      } else {
        body = { success: true };
      }

      const bodyBase64 = Buffer.from(JSON.stringify(body)).toString('base64');
      send('Fetch.fulfillRequest', {
        requestId,
        responseCode: 200,
        responseHeaders: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'Access-Control-Allow-Origin', value: '*' },
          { name: 'Access-Control-Allow-Headers', value: '*' },
        ],
        body: bodyBase64,
      });
    }
  };

  await new Promise((res) => (ws.onopen = res));

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  // Enable Fetch interception for API calls
  await send('Fetch.enable', {
    patterns: [{ urlPattern: '*8080/api*', requestStage: 'Request' }]
  });

  const roles = [
    {
      name: 'customer',
      role: 'CUSTOMER',
      path: '/customer/dashboard',
      user: { id: 1, firstName: 'Sreeja', lastName: 'Reddy', email: 'customer@shopivo.com', role: 'CUSTOMER' },
      lightFile: 'customer_dashboard_light.png',
      darkDesktopFile: 'customer_dashboard_dark.png',
      darkMobileFile: 'customer_dashboard_dark_mobile.png',
    },
    {
      name: 'seller',
      role: 'SELLER',
      path: '/seller/dashboard',
      user: { id: 2, firstName: 'Apex', lastName: 'Electronics', email: 'seller@shopivo.com', role: 'SELLER' },
      lightFile: 'seller_dashboard_light.png',
      darkDesktopFile: 'seller_dashboard_dark.png',
      darkMobileFile: 'seller_dashboard_dark_mobile.png',
    },
    {
      name: 'admin',
      role: 'ADMIN',
      path: '/admin/dashboard',
      user: { id: 3, firstName: 'Admin', lastName: 'Director', email: 'admin@shopivo.com', role: 'ADMIN' },
      lightFile: 'admin_dashboard_light.png',
      darkDesktopFile: 'admin_dashboard_dark.png',
      darkMobileFile: 'admin_dashboard_dark_mobile.png',
    },
  ];

  for (const item of roles) {
    console.log(`\n=== Processing ${item.name.toUpperCase()} Dashboard ===`);

    // 1. Desktop Light Mode
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
    await wait(600);

    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('sc_access_token', 'mock_jwt_token_for_dashboard_preview');
        localStorage.setItem('sc_user', JSON.stringify(${JSON.stringify(item.user)}));
        localStorage.setItem('secure-ai-theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
      `
    });

    console.log(`Navigating to ${item.path} (Light Mode)...`);
    await send('Page.navigate', { url: `http://127.0.0.1:5173${item.path}` });
    await wait(2800);

    const shotLight = await send('Page.captureScreenshot', { format: 'png' });
    const bufferLight = Buffer.from(shotLight.result.data, 'base64');
    fs.writeFileSync(path.join(ARTIFACT_DIR, item.lightFile), bufferLight);
    console.log(`Saved Light Desktop: ${item.lightFile} (${bufferLight.length} bytes)`);

    // 2. Desktop Dark Mode (CyberForge Black + Vibrant Emerald + White)
    console.log(`Switching to Dark Mode on ${item.path} (Desktop 1440x900)...`);
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('secure-ai-theme', 'dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      `
    });
    await wait(2000);

    const shotDarkDesktop = await send('Page.captureScreenshot', { format: 'png' });
    const bufferDarkDesktop = Buffer.from(shotDarkDesktop.result.data, 'base64');
    fs.writeFileSync(path.join(ARTIFACT_DIR, item.darkDesktopFile), bufferDarkDesktop);
    console.log(`Saved Dark Desktop: ${item.darkDesktopFile} (${bufferDarkDesktop.length} bytes)`);

    // 3. Mobile Dark Mode (CyberForge Black + Vibrant Emerald + White)
    console.log(`Setting Mobile Viewport (390x844)...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await wait(1500);

    const shotDarkMobile = await send('Page.captureScreenshot', { format: 'png' });
    const bufferDarkMobile = Buffer.from(shotDarkMobile.result.data, 'base64');
    fs.writeFileSync(path.join(ARTIFACT_DIR, item.darkMobileFile), bufferDarkMobile);
    console.log(`Saved Dark Mobile: ${item.darkMobileFile} (${bufferDarkMobile.length} bytes)`);
  }

  ws.close();
  chrome.kill();
  console.log('\nAll dashboard screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});

