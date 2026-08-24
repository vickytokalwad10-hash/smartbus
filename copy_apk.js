const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'client', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

if (!fs.existsSync(src)) {
  console.error('Source APK not found at:', src);
  process.exit(1);
}

// Read or initialize build version
const versionFile = path.join(__dirname, 'build_version.txt');
let version = 1;
if (fs.existsSync(versionFile)) {
  version = parseInt(fs.readFileSync(versionFile, 'utf8')) + 1;
}
fs.writeFileSync(versionFile, version.toString());

const apkName = `JD_College_Bus_Pass_v${version}.0.apk`;

const oneDriveDir = 'C:\\Users\\hp\\OneDrive\\Documents\\smartbus';
const desktopDir = 'C:\\Users\\hp\\OneDrive\\Desktop';
const brainDir = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\0128cd6a-66da-4a27-b008-fcce94f737db';

[oneDriveDir, desktopDir, brainDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
  }
});

const destinations = [
  path.join(__dirname, apkName),
  path.join(__dirname, 'smartbus.apk'), // keep a stable name too
  path.join(brainDir, apkName),
  path.join(desktopDir, apkName),
];

for (const dst of destinations) {
  try {
    fs.copyFileSync(src, dst);
    const stat = fs.statSync(dst);
    console.log(`Copied to: ${dst} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (e) {
    console.error(`Failed to copy to ${dst}:`, e.message);
  }
}
