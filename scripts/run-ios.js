const { spawn, spawnSync } = require('child_process');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const iosDir = path.join(root, 'ios');
const derivedDataPath = path.join(iosDir, 'build');
const appPath = path.join(
  derivedDataPath,
  'Build',
  'Products',
  'Debug-iphonesimulator',
  'RMSHRentals.app',
);

const preferredSimulator =
  process.env.IOS_SIMULATOR ||
  process.argv.find(arg => arg.startsWith('--simulator='))?.split('=')[1] ||
  'iPhone 17 Pro';

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

const read = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} failed`);
  }

  return result.stdout;
};

const isMetroRunning = () =>
  new Promise(resolve => {
    const req = http.get('http://localhost:8081/status', res => {
      res.resume();
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });

const waitForMetro = async () => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await isMetroRunning()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

const ensureMetro = async () => {
  if (await isMetroRunning()) {
    console.log('Metro is already running on port 8081.');
    return;
  }

  console.log('Starting Metro on port 8081...');
  const metro = spawn('npm', ['run', 'start'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
  });
  metro.unref();
  await waitForMetro();
};

const simulatorVersion = runtime => {
  const match = runtime.match(/iOS-(\d+)-(\d+)/);
  if (!match) {
    return 0;
  }
  return Number(match[1]) * 100 + Number(match[2]);
};

const pickSimulator = () => {
  const json = read('xcrun', ['simctl', 'list', 'devices', 'available', '--json']);
  const parsed = JSON.parse(json);
  const devices = Object.entries(parsed.devices)
    .flatMap(([runtime, runtimeDevices]) =>
      runtimeDevices.map(device => ({ ...device, runtime })),
    )
    .filter(device => device.isAvailable);

  const byName = devices
    .filter(device => device.name === preferredSimulator)
    .sort((a, b) => simulatorVersion(b.runtime) - simulatorVersion(a.runtime))[0];

  if (byName) {
    return byName;
  }

  const fallback = devices
    .filter(device => device.name.startsWith('iPhone'))
    .sort((a, b) => simulatorVersion(b.runtime) - simulatorVersion(a.runtime))[0];

  if (!fallback) {
    throw new Error('No available iOS simulator found.');
  }

  return fallback;
};

const readBundleId = () =>
  read('/usr/libexec/PlistBuddy', [
    '-c',
    'Print CFBundleIdentifier',
    path.join(appPath, 'Info.plist'),
  ]).trim();

const main = async () => {
  await ensureMetro();

  const simulator = pickSimulator();
  console.log(`Using simulator: ${simulator.name} (${simulator.runtime})`);

  if (simulator.state !== 'Booted') {
    run('xcrun', ['simctl', 'boot', simulator.udid]);
  }
  run('xcrun', ['simctl', 'bootstatus', simulator.udid, '-b']);

  run(
    'xcodebuild',
    [
      '-workspace',
      'RMSHRentals.xcworkspace',
      '-configuration',
      'Debug',
      '-scheme',
      'RMSHRentals',
      '-sdk',
      'iphonesimulator',
      '-destination',
      'generic/platform=iOS Simulator',
      '-derivedDataPath',
      derivedDataPath,
      'ARCHS=arm64',
      'ONLY_ACTIVE_ARCH=YES',
      'build',
    ],
    { cwd: iosDir },
  );

  run('xcrun', ['simctl', 'install', simulator.udid, appPath]);
  const bundleId = readBundleId();
  run('xcrun', ['simctl', 'launch', simulator.udid, bundleId]);
  console.log(`Launched ${bundleId} on ${simulator.name}.`);
};

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
