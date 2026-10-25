import asyncio
import os
import sys
import json
import subprocess

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import edge_tts

SCENES = [
    {
        "id": "scene1",
        "title": "Intro & Architecture",
        "text": "Welcome to AegisMesh QVAC, an air-gapped autonomous AI multisig co-signer and peer-to-peer offline settlement engine built for the Tether AI Yako Hackathon. Running locally on a Windows 11 Intel Core i5 laptop with under 300 megabytes of RAM, AegisMesh unites QVAC Local AI, Tether WDK, and Pears P2P."
    },
    {
        "id": "scene2",
        "title": "Scenario 1: Legitimate Merchant Escrow",
        "text": "First, let's execute Scenario 1: a legitimate 1,250 USDt solar hardware escrow. QVAC's local Qwen 2.5 neural engine decompiles the raw EVM hex calldata offline, verifying the standard ERC-20 transfer selector matches the user's intent. Tether WDK then co-signs the EIP-712 HTLC voucher locally."
    },
    {
        "id": "scene3",
        "title": "Scenario 2: Malicious Drainer Trap Blocked",
        "text": "Next, Scenario 2 tests a phishing blind-signing trap. Although the human prompt claims to be a zero-USDt wallet verification, QVAC's offline bytecode decompiler catches the 0x095ea7b3 unlimited MAX_UINT256 token approval trap, triggers a 99 out of 100 threat score, and physically locks the Tether WDK signing vault."
    },
    {
        "id": "scene4",
        "title": "Air-Gap Mode, Pears P2P Mesh & Disaster Payroll",
        "text": "Now, we engage the Sovereign Air-Gap Killer Switch, cutting network traffic to zero kilobytes per second, and load Scenario 3: Disaster-Zone Micro-Payroll. We co-sign the batch completely offline via Tether WDK, broadcast it across our local Pears P2P mesh, and launch the Optical Air-Gap QR Frame Streamer for device-to-device settlement."
    },
    {
        "id": "scene5",
        "title": "Hardware Benchmark & Codebase Proof",
        "text": "Finally, Scenario 4 runs our Cloud-to-Pocket hardware benchmark on the 11th Gen Intel Core i5-1155G7, demonstrating 19 milliseconds time-to-first-token and 100 percent local privacy, alongside our full modular Node.js architecture for QVAC, WDK, and Pears. Thank you."
    }
]

VOICE = "en-US-ChristopherNeural"
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "audio")

async def generate_scene_audio(scene):
    out_path = os.path.join(AUDIO_DIR, f"{scene['id']}.mp3")
    print(f"🎙️ Generating voiceover for {scene['id']} ({scene['title']})...")
    communicate = edge_tts.Communicate(scene['text'], VOICE, rate="+3%", pitch="+0Hz")
    await communicate.save(out_path)
    return out_path

async def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)
    manifest = []
    
    for scene in SCENES:
        out_path = await generate_scene_audio(scene)
        file_size = os.path.getsize(out_path)
        manifest.append({
            "id": scene["id"],
            "title": scene["title"],
            "file": os.path.abspath(out_path),
            "size": file_size
        })
    
    manifest_path = os.path.join(AUDIO_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    
    print("\n✅ All 5 AI voiceover tracks generated successfully!")
    print(f"📄 Manifest written to: {manifest_path}")

if __name__ == "__main__":
    asyncio.run(main())
