const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EXECUTABLE_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

async function captureScreenshots() {
    let executablePath = null;
    for (const p of EXECUTABLE_PATHS) {
        if (fs.existsSync(p)) {
            executablePath = p;
            break;
        }
    }

    if (!executablePath) {
        console.error('Could not find Chrome or Edge executable.');
        process.exit(1);
    }

    console.log(`Using browser: ${executablePath}`);

    const browser = await puppeteer.launch({
        executablePath,
        headless: "new",
        defaultViewport: { width: 1280, height: 800 }
    });

    const page = await browser.newPage();
    
    const outDir = path.join(__dirname, '..', 'docs', 'assets');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    console.log('Taking screenshot of Home Page...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(outDir, 'screenshot-home.png') });

    console.log('Taking screenshot of Login Page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(outDir, 'screenshot-login.png') });

    console.log('Taking screenshot of Community Board...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    // Wait a bit for map tiles
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outDir, 'screenshot-dashboard.png') });

    console.log('Taking screenshot of Digital Twin...');
    await page.goto('http://localhost:5173/digital-twin', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outDir, 'screenshot-digital-twin.png') });

    console.log('Taking screenshot of Analytics...');
    await page.goto('http://localhost:5173/analytics', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(outDir, 'screenshot-analytics.png') });

    // Login for admin and report pages
    console.log('Logging in as admin...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await page.type('input[type="email"]', 'admin@citycare.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('Taking screenshot of Report Page...');
    await page.goto('http://localhost:5173/report', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, 'screenshot-report.png') });

    console.log('Taking screenshot of Admin Panel...');
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, 'screenshot-admin.png') });

    console.log('Taking screenshot of API Explorer...');
    await page.goto('http://localhost:5173/api-explorer', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, 'screenshot-api-explorer.png') });

    await browser.close();
    console.log('All screenshots captured!');
}

captureScreenshots().catch(console.error);
