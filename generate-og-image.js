const path = require('path');
const fs = require('fs');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch {
  puppeteer = require('/Users/boyka777/Arc Light Property/ARC-LIGHT-PROPERTY/node_modules/puppeteer');
}

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
    headless: true,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  const templatePath = path.resolve(__dirname, 'og-preview-template.html');
  await page.goto('file://' + templatePath, { waitUntil: 'networkidle0' });

  // Wait for all images to load completely
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images).map(img =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = () => reject(new Error('Failed to load image: ' + img.src));
            })
      )
    );
  });

  const outputPath = path.resolve(__dirname, 'assets/og-preview.png');
  const imagesOutputPath = path.resolve(__dirname, 'assets/images/og-preview.png');

  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });

  fs.copyFileSync(outputPath, imagesOutputPath);
  console.log('OG preview image saved to:', outputPath);
  console.log('OG preview image copied to:', imagesOutputPath);

  await browser.close();
})();

