const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

const audioDir = path.join(__dirname, '..', 'audio');
const files = ['scene1.mp3', 'scene2.mp3', 'scene3.mp3', 'scene4.mp3', 'scene5.mp3'];

const durations = {};

for (const f of files) {
  const filePath = path.join(audioDir, f);
  const result = spawnSync(ffmpeg, ['-i', filePath], { encoding: 'utf8' });
  const output = result.stderr || result.stdout;
  const match = output.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (match) {
    const hours = parseFloat(match[1]);
    const mins = parseFloat(match[2]);
    const secs = parseFloat(match[3]);
    const totalSecs = hours * 3600 + mins * 60 + secs;
    durations[f.replace('.mp3', '')] = parseFloat(totalSecs.toFixed(2));
  } else {
    durations[f.replace('.mp3', '')] = 20.0;
  }
}

fs.writeFileSync(path.join(audioDir, 'durations.json'), JSON.stringify(durations, null, 2));
console.log('Audio Durations:', durations);
