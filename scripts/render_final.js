/**
 * AegisMesh QVAC - Precision Master Video Renderer
 * Synchronizes voiceover narration perfectly with Playwright UI actions,
 * pads inter-scene pauses, and encodes ultra-crisp H.264 60 FPS (CRF 16).
 */

const { spawnSync, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

const projectRoot = path.join(__dirname, '..');
const audioDir = path.join(projectRoot, 'audio');
const recordingsDir = path.join(projectRoot, 'recordings');
const outputVideo = path.join(projectRoot, 'AegisMesh_QVAC_Official_Demo.mp4');

// Exact scene timings recorded by Playwright (seconds)
const sceneTimings = [
  { id: 'scene1', audio: 'scene1.mp3', targetDur: 23.03 },
  { id: 'scene2', audio: 'scene2.mp3', targetDur: 25.34 },
  { id: 'scene3', audio: 'scene3.mp3', targetDur: 25.07 },
  { id: 'scene4', audio: 'scene4.mp3', targetDur: 27.49 },
  { id: 'scene5', audio: 'scene5.mp3', targetDur: 37.65 }
];

async function renderMasterVideo() {
  console.log('================================================================================');
  console.log('🎞️  AegisMesh QVAC Master Video Rendering Pipeline');
  console.log('================================================================================\n');

  // Step 1: Find recorded video
  const recordedInfoPath = path.join(recordingsDir, 'recorded_video.json');
  let recordedVideoPath = null;

  if (fs.existsSync(recordedInfoPath)) {
    try {
      const info = JSON.parse(fs.readFileSync(recordedInfoPath, 'utf8'));
      recordedVideoPath = info.videoPath;
    } catch (_) {}
  }

  if (!recordedVideoPath || !fs.existsSync(recordedVideoPath)) {
    const files = fs.readdirSync(recordingsDir)
      .filter(f => f.endsWith('.webm'))
      .map(f => path.join(recordingsDir, f))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    if (files.length === 0) {
      throw new Error('No recorded webm video found in ' + recordingsDir);
    }
    recordedVideoPath = files[0];
  }

  console.log(`📹 Using source Playwright recording: ${recordedVideoPath}`);
  const webmStats = fs.statSync(recordedVideoPath);
  console.log(`   Source size: ${(webmStats.size / (1024 * 1024)).toFixed(2)} MB`);

  // Step 2: Create synchronized audio segments with apad filter
  console.log('\n🎙️  Building synchronized voiceover timeline...');
  const paddedAudioFiles = [];

  for (const scene of sceneTimings) {
    const inputAudio = path.join(audioDir, scene.audio);
    const paddedAudio = path.join(audioDir, `${scene.id}_padded.wav`);
    paddedAudioFiles.push(paddedAudio);

    console.log(`   Aligning ${scene.id}: padding to ${scene.targetDur}s...`);
    // apad pads audio with silence up to exact whole_dur seconds
    const padArgs = [
      '-y',
      '-i', inputAudio,
      '-af', `apad=whole_dur=${scene.targetDur}`,
      '-c:a', 'pcm_s16le',
      paddedAudio
    ];
    const res = spawnSync(ffmpegPath, padArgs, { stdio: 'pipe' });
    if (res.status !== 0) {
      console.error(res.stderr.toString());
      throw new Error(`Failed to pad audio for ${scene.id}`);
    }
  }

  // Step 3: Concatenate padded segments into master_audio.wav
  const masterAudioPath = path.join(audioDir, 'master_synchronized_audio.wav');
  const concatListPath = path.join(audioDir, 'padded_concat_list.txt');
  const concatContent = paddedAudioFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
  fs.writeFileSync(concatListPath, concatContent, 'utf8');

  console.log('\n🔗 Stitching master synchronized voiceover track...');
  const stitchArgs = [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatListPath,
    '-c', 'copy',
    masterAudioPath
  ];
  const stitchRes = spawnSync(ffmpegPath, stitchArgs, { stdio: 'pipe' });
  if (stitchRes.status !== 0) {
    console.error(stitchRes.stderr.toString());
    throw new Error('Failed to stitch master audio');
  }
  console.log(`✓ Master synchronized audio ready: ${(fs.statSync(masterAudioPath).size / (1024 * 1024)).toFixed(2)} MB`);

  // Step 4: Encode final crisp Hackathon Demo MP4
  console.log('\n🚀 Encoding Final Hackathon Demo MP4...');
  console.log('   Video Codec: libx264');
  console.log('   Preset: fast');
  console.log('   CRF: 16 (Near-lossless crisp text & UI rendering)');
  console.log('   Pixel Format: yuv420p');
  console.log('   Frame Rate: 60 FPS');
  console.log('   Audio Codec: AAC 192kbps 48kHz Stereo');
  console.log(`   Output File: ${outputVideo}\n`);

  const renderArgs = [
    '-y',
    '-i', recordedVideoPath,
    '-i', masterAudioPath,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '16',
    '-pix_fmt', 'yuv420p',
    '-r', '60',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    outputVideo
  ];

  const startTime = Date.now();
  console.log(`Executing FFmpeg command...`);
  const renderRes = spawnSync(ffmpegPath, renderArgs, { stdio: 'inherit' });
  if (renderRes.status !== 0) {
    throw new Error(`FFmpeg encoding failed with code ${renderRes.status}`);
  }

  const renderElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n================================================================================');
  console.log(`🎉 Demo Video successfully rendered in ${renderElapsed}s!`);
  const finalStats = fs.statSync(outputVideo);
  console.log(`📁 File: ${outputVideo}`);
  console.log(`📊 Size: ${(finalStats.size / (1024 * 1024)).toFixed(2)} MB`);

  // Probe output video
  const probeRes = spawnSync(ffmpegPath, ['-i', outputVideo], { stdio: 'pipe' });
  const probeOutput = probeRes.stderr ? probeRes.stderr.toString() : '';
  const durationMatch = probeOutput.match(/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/);
  const videoStreamMatch = probeOutput.match(/Video: (.+)/);
  const audioStreamMatch = probeOutput.match(/Audio: (.+)/);

  if (durationMatch) console.log(`⏱️  Duration: ${durationMatch[1]}`);
  if (videoStreamMatch) console.log(`🖥️  Video Stream: ${videoStreamMatch[1]}`);
  if (audioStreamMatch) console.log(`🔊 Audio Stream: ${audioStreamMatch[1]}`);
  console.log('================================================================================\n');

  return outputVideo;
}

if (require.main === module) {
  renderMasterVideo().catch(err => {
    console.error('Render error:', err);
    process.exit(1);
  });
}

module.exports = { renderMasterVideo };
