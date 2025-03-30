'use client';

import { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import { toBlobURL } from '@ffmpeg/util';
import dynamic from 'next/dynamic';
import audioBufferToWav from 'audiobuffer-to-wav';
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Dynamically load FFmpeg to ensure it runs on the client
const FFmpegLoader = dynamic(
  () => import('@ffmpeg/ffmpeg').then((mod) => mod.FFmpeg),
  { 
    ssr: false,
    loading: () => <p>Loading FFmpeg...</p>
  }
);

export default function GenerateMusicPage() {
  // Audio-related states
  const [audioFile, setAudioFile] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [sourceNode, setSourceNode] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState(null);

  // Tone.js effects and trim parameters
  const [echoDelay, setEchoDelay] = useState(0.3);       
  const [echoFeedback, setEchoFeedback] = useState(0.5);   
  const [reverbDecay, setReverbDecay] = useState(1.5);     
  const [reverbPreDelay, setReverbPreDelay] = useState(0.01);
  const [trimStart, setTrimStart] = useState(0);           
  const [trimEnd, setTrimEnd] = useState(0);               

  // FFmpeg states and refs for animation and timing
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const ffmpegRef = useRef(null);
  const startTimeRef = useRef(0);
  const rafIdRef = useRef(null);

  

  // Initialize AudioContext and load FFmpeg WASM
  useEffect(() => {
    const initAudioContext = async () => {
      const context = new AudioContext();
      setAudioContext(context);
    };
    initAudioContext();

    const loadFFmpeg = async () => {
      if (typeof window === 'undefined') return;
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
      ffmpegRef.current = new FFmpeg();
      const ffmpeg = ffmpegRef.current;
      ffmpeg.on('log', ({ message }) => console.log(message));
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setFfmpegLoaded(true);
    };

    loadFFmpeg();

    return () => {
      audioContext?.close();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      ffmpegRef.current?.exit();
    };
  }, []);

  // Handle file upload and decode audio
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !audioContext) return;
    setAudioFile(file);
    const arrayBuffer = await file.arrayBuffer();
    const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Ensure we have at least 2 channels
    let safeBuffer = decodedBuffer;
    if (decodedBuffer.numberOfChannels < 1) {
      const newBuffer = audioContext.createBuffer(2, decodedBuffer.length, decodedBuffer.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        newBuffer.copyToChannel(decodedBuffer.getChannelData(0), ch);
      }
      safeBuffer = newBuffer;
    }
    
    setAudioBuffer(safeBuffer);
    setDuration(safeBuffer.duration);
    setTrimEnd(safeBuffer.duration); // default trim end = full duration
  };

  // Simple play/pause using the native AudioContext
  const handlePlayPause = async () => {
    if (!audioContext || !audioBuffer) return;
    if (isPlaying) {
      sourceNode?.stop();
      setSourceNode(null);
      setIsPlaying(false);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    } else {
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = playbackRate;
      source.connect(audioContext.destination);
      source.start(0, currentTime);
      source.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      };
      setSourceNode(source);
      setIsPlaying(true);
      startTimeRef.current = audioContext.currentTime - currentTime;
      const updateTime = () => {
        if (!isPlaying || !audioContext) return;
        const elapsed = audioContext.currentTime - startTimeRef.current;
        setCurrentTime(Math.min(elapsed, duration));
        if (elapsed < duration) rafIdRef.current = requestAnimationFrame(updateTime);
      };
      rafIdRef.current = requestAnimationFrame(updateTime);
    }
  };

  // Handle changes for playback speed and effect parameters
  const handleSpeedChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
    if (sourceNode) sourceNode.playbackRate.value = newRate;
  };

  const handleEchoDelayChange = (e) => setEchoDelay(parseFloat(e.target.value));
  const handleEchoFeedbackChange = (e) => setEchoFeedback(parseFloat(e.target.value));
  const handleReverbDecayChange = (e) => setReverbDecay(parseFloat(e.target.value));
  const handleReverbPreDelayChange = (e) => setReverbPreDelay(parseFloat(e.target.value));
  const handleTrimStartChange = (e) => setTrimStart(parseFloat(e.target.value));
  const handleTrimEndChange = (e) => setTrimEnd(parseFloat(e.target.value));

  // Process the audio offline using Tone.js and convert to MP3 with FFmpeg
  const handleDownload = async () => {
    if (!audioBuffer || !ffmpegLoaded || !audioContext) return;
    
    // Validate trim values
    const tStart = Math.max(0, trimStart);
    const tEnd = Math.min(duration, trimEnd);
    if (tEnd <= tStart) {
      alert("Invalid trim values.");
      return;
    }
    const renderDuration = tEnd - tStart;
    
    let renderedBuffer;
    try {
      renderedBuffer = await Tone.Offline(async (offlineContext) => {
        // Create Tone.js buffer and player with effects
        const toneBuffer = new Tone.Buffer(audioBuffer);
        const player = new Tone.Player({
          url: toneBuffer,
          playbackRate: playbackRate,
          autostart: false,
        });
        
        const echo = new Tone.FeedbackDelay({
          delayTime: echoDelay,
          feedback: echoFeedback,
        });
        const reverb = new Tone.Reverb({
          decay: reverbDecay,
          preDelay: reverbPreDelay,
        });
        
        player.chain(echo, reverb, offlineContext.destination);
        player.start(0, tStart, renderDuration);
      }, renderDuration, 2, audioBuffer.sampleRate);
    } catch (err) {
      console.error("Tone.Offline error:", err);
      alert("Rendering error: " + err.message);
      return;
    }
    
    // Convert the rendered AudioBuffer to WAV and then to MP3 using FFmpeg WASM
    const wavData = audioBufferToWav(renderedBuffer);
    const wavBlob = new Blob([wavData], { type: 'audio/wav' });
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile('input.wav', new Uint8Array(await wavBlob.arrayBuffer()));
    await ffmpeg.exec(['-i', 'input.wav', 'output.mp3']);
    const data = await ffmpeg.readFile('output.mp3');
    const outputBlob = new Blob([data], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(outputBlob);
    
    // Trigger the download
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_${playbackRate}x.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format seconds into minutes:seconds
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);
    return `${minutes}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <hr className="border-t border-gray-200" />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 transition-all duration-300 ease-in-out">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-6 animate-fadeIn">
            Generate Music
          </h2>
          <section className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg animate-fadeIn">
            <div className="mb-6">
              <label className="block text-lg font-medium text-gray-700 mb-2">
                Upload Audio File
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-all duration-200"
              />
            </div>
            {audioFile && (
              <div className="space-y-8 animate-fadeIn">
                {/* Playback Controls */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePlayPause}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition transform hover:scale-105"
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <span className="text-gray-600 text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Playback Speed Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Playback Speed: {playbackRate}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={playbackRate}
                    onChange={handleSpeedChange}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {/* Echo Controls */}
                <fieldset className="border p-4 rounded-md">
                  <legend className="text-base font-medium text-gray-800">
                    Echo Effects
                  </legend>
                  <div className="mt-2 space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700">
                        Echo Delay (sec): {echoDelay}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={echoDelay}
                        onChange={handleEchoDelayChange}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700">
                        Echo Feedback: {echoFeedback}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={echoFeedback}
                        onChange={handleEchoFeedbackChange}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Reverb Controls */}
                <fieldset className="border p-4 rounded-md">
                  <legend className="text-base font-medium text-gray-800">
                    Reverb Effects
                  </legend>
                  <div className="mt-2 space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700">
                        Reverb Decay (sec): {reverbDecay}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={reverbDecay}
                        onChange={handleReverbDecayChange}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700">
                        Reverb PreDelay (sec): {reverbPreDelay}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={reverbPreDelay}
                        onChange={handleReverbPreDelayChange}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Trim Controls */}
                <fieldset className="border p-4 rounded-md">
                  <legend className="text-base font-medium text-gray-800">
                    Trim Audio
                  </legend>
                  <div className="mt-2 space-y-3">
                    <div>
                      <label className="block text-sm text-gray-700">
                        Trim Start (sec): {trimStart.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={trimStart}
                        onChange={handleTrimStartChange}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700">
                        Trim End (sec): {trimEnd.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={duration}
                        step="0.1"
                        value={trimEnd}
                        onChange={handleTrimEndChange}
                        className="w-full accent-indigo-600"
                      />
                    </div>
                  </div>
                </fieldset>

                <div className="text-center">
                  <button
                    onClick={handleDownload}
                    disabled={!ffmpegLoaded}
                    className="px-6 py-3 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition transform hover:scale-105 disabled:opacity-50"
                  >
                    {ffmpegLoaded ? 'Download Processed Audio' : 'Loading FFmpeg...'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
      <Footer />
    </div>
  );
}
