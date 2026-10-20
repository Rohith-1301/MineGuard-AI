const fs = require('fs');
const path = require('path');
const readline = require('readline');

function parseViewFileLines(content) {
  const lines = content.split('\n');
  const codeLines = {};
  let recording = false;
  for (const line of lines) {
    if (line.includes('The following code has been modified to include a line number before every line')) {
      recording = true;
      continue;
    }
    if (line.includes('The above content shows the entire') || line.includes('The above content does NOT show the entire')) {
      break;
    }
    if (recording) {
      const match = line.match(/^\s*(\d+):(?: (.*)|$)/);
      if (match) {
        const lineNum = parseInt(match[1]);
        codeLines[lineNum] = match[2] !== undefined ? match[2] : '';
      }
    }
  }
  return codeLines;
}

function parseViewFileContent(content) {
  const linesObj = parseViewFileLines(content);
  const sortedKeys = Object.keys(linesObj).map(Number).sort((a,b) => a-b);
  const out = [];
  for (const k of sortedKeys) {
    out.push(linesObj[k]);
  }
  return out.join('\n');
}

async function main() {
  const transcriptPath = 'C:\\Users\\Rohith\\.gemini\\antigravity\\brain\\e0d0bb87-46a1-4413-baff-f4a1fae6b2f6\\.system_generated\\logs\\transcript_full.jsonl';
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const targetLines = {
    3661: 'tailwind.config.js',
    3663: 'index.html',
    3682: 'src/index.css',
    3684: 'src/App.tsx',
    3686: 'src/components/common/Header.tsx',
    3688: 'src/components/common/Sidebar.tsx',
    3692: 'src/components/common/MetricCard.tsx',
    3694: 'src/components/common/RiskGauge.tsx',
    3696: 'src/components/common/StatusIndicator.tsx',
    3698: 'src/components/command-center/CommandCenter.tsx',
    3700: 'src/components/rover-live/RoverLive.tsx',
    3714: 'src/components/environment/EnvironmentDashboard.tsx',
    3716: 'src/components/environment/TelemetryTrendChart.tsx',
    3718: 'src/components/workers/WorkerDashboard.tsx',
    3720: 'src/components/map/MineMapDashboard.tsx',
    3724: 'src/components/alerts/AlertsDashboard.tsx',
    3726: 'src/components/analytics/AnalyticsDashboard.tsx',
    3728: 'src/components/system-status/SystemStatusDashboard.tsx',
    3730: 'src/components/common/EmergencyModal.tsx',
    3732: 'src/components/common/StreamSettingsModal.tsx',
  };

  const workerModalLines = {};
  const tunnelModalLines = {};

  let lineNo = 0;
  console.log('Reading transcript...');
  for await (const line of rl) {
    lineNo++;

    if (targetLines[lineNo]) {
      const relPath = targetLines[lineNo];
      const obj = JSON.parse(line);
      const code = parseViewFileContent(obj.content);
      const absPath = path.resolve('C:\\Users\\Rohith\\.gemini\\antigravity\\scratch\\mineguard-ai', relPath);
      fs.writeFileSync(absPath, code, 'utf8');
      console.log(`[RESTORED] ${relPath} (${code.split('\n').length} lines)`);
    }

    if (lineNo === 3760 || lineNo === 3762) {
      const obj = JSON.parse(line);
      Object.assign(workerModalLines, parseViewFileLines(obj.content));
    }

    if ([3777, 3779, 3781, 3783].includes(lineNo)) {
      const obj = JSON.parse(line);
      Object.assign(tunnelModalLines, parseViewFileLines(obj.content));
    }
  }

  // Restore WorkerProfileModal.tsx
  const sortedWorkerKeys = Object.keys(workerModalLines).map(Number).sort((a,b) => a-b);
  const workerCode = sortedWorkerKeys.map(k => workerModalLines[k]).join('\n');
  const workerAbsPath = path.resolve('C:\\Users\\Rohith\\.gemini\\antigravity\\scratch\\mineguard-ai', 'src/components/workers/WorkerProfileModal.tsx');
  fs.writeFileSync(workerAbsPath, workerCode, 'utf8');
  console.log(`[RESTORED] src/components/workers/WorkerProfileModal.tsx (${sortedWorkerKeys.length} lines)`);

  // Restore TunnelDetailModal.tsx
  const sortedTunnelKeys = Object.keys(tunnelModalLines).map(Number).sort((a,b) => a-b);
  const tunnelCode = sortedTunnelKeys.map(k => tunnelModalLines[k]).join('\n');
  const tunnelAbsPath = path.resolve('C:\\Users\\Rohith\\.gemini\\antigravity\\scratch\\mineguard-ai', 'src/components/map/TunnelDetailModal.tsx');
  fs.writeFileSync(tunnelAbsPath, tunnelCode, 'utf8');
  console.log(`[RESTORED] src/components/map/TunnelDetailModal.tsx (${sortedTunnelKeys.length} lines)`);

  console.log('Main files restored successfully!');
}

main().catch(err => {
  console.error('Error during restore:', err);
  process.exit(1);
});
