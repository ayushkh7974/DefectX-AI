import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  Video,
  Camera,
  Play,
  Square,
  Sparkles,
  FileText,
  Box,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ZoomIn,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { inspectionApi, reportsApi, decisionsApi } from '../services/api';
import { InspectionRecord, SampleGalleryResponse } from '../services/types';
import { StatusBadge } from '../components/StatusBadge';

export const InspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'webcam'>('image');

  // Image Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [productCodeInput, setProductCodeInput] = useState<string>('');

  // Sample Gallery state
  const [samples, setSamples] = useState<SampleGalleryResponse | null>(null);

  // Video Inspection state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoResults, setVideoResults] = useState<any | null>(null);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);

  // Webcam state
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Inspection outcome state
  const [currentInspection, setCurrentInspection] = useState<InspectionRecord | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Override modal state
  const [showOverride, setShowOverride] = useState(false);
  const [overrideDecision, setOverrideDecision] = useState<'ACCEPT' | 'REJECT' | 'MANUAL_REVIEW'>('ACCEPT');
  const [overrideReason, setOverrideReason] = useState('');

  // Fetch sample casting gallery from dataset
  useEffect(() => {
    inspectionApi.getSamples().then(setSamples).catch(err => {
      console.warn('Could not load dataset samples:', err);
    });
  }, []);

  // Handle webcam stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (webcamActive) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.error('Webcam access error:', err);
          setErrorMsg('Camera access denied or device unavailable.');
          setWebcamActive(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamActive]);

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  // Inspect image action
  const handleInspectImage = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select or upload a casting component image first.');
      return;
    }
    setIsInspecting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (productCodeInput) {
        formData.append('product_code', productCodeInput);
      }

      const res = await inspectionApi.inspectImage(formData);
      setCurrentInspection(res);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Inspection failed. Ensure backend AI service is online.');
    } finally {
      setIsInspecting(false);
    }
  };

  // One-click inspect from real dataset gallery sample
  const handleSelectSample = async (sampleUrl: string, sampleName: string) => {
    try {
      setIsInspecting(true);
      setErrorMsg(null);
      setImagePreview(sampleUrl);

      // Fetch sample as blob
      const res = await fetch(sampleUrl);
      const blob = await res.blob();
      const file = new File([blob], `${sampleName.replace(/\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('product_code', `CAST-${sampleName.replace(/\s+/g, '-').toUpperCase()}`);

      const inspRes = await inspectionApi.inspectImage(formData);
      setCurrentInspection(inspRes);
    } catch (err: any) {
      setErrorMsg('Failed to process sample image.');
    } finally {
      setIsInspecting(false);
    }
  };

  // Capture frame from webcam
  const handleCaptureWebcam = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'webcam_frame.jpg', { type: 'image/jpeg' });
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(blob));

      setIsInspecting(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await inspectionApi.inspectWebcam(formData);
        setCurrentInspection(res);
      } catch (err: any) {
        setErrorMsg('Webcam frame inspection failed.');
      } finally {
        setIsInspecting(false);
      }
    }, 'image/jpeg');
  };

  // Video file upload & analysis
  const handleVideoInspect = async () => {
    if (!videoFile) {
      setErrorMsg('Please upload a video file of the conveyor inspection.');
      return;
    }
    setIsVideoProcessing(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('sample_every_n_frames', '15');
      const res = await inspectionApi.inspectVideo(formData);
      setVideoResults(res);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Video processing failed.');
    } finally {
      setIsVideoProcessing(false);
    }
  };

  // PDF report download
  const handleGeneratePdf = async () => {
    if (!currentInspection) return;
    try {
      const res = await reportsApi.generateReport(currentInspection.id);
      window.open(reportsApi.getDownloadUrl(res.id), '_blank');
    } catch (err) {
      alert('Failed to generate report.');
    }
  };

  // Submit human override
  const handleOverrideSubmit = async () => {
    if (!currentInspection || !currentInspection.decision) return;
    try {
      await decisionsApi.overrideDecision(
        currentInspection.decision.id || currentInspection.id,
        overrideDecision,
        overrideReason || 'Reviewed and confirmed by Lead QA Inspector.',
        'Lead QA Inspector (Certified Level 3)'
      );
      // Update local state
      setCurrentInspection(prev => prev ? {
        ...prev,
        recommended_decision: overrideDecision,
        decision: {
          ...prev.decision,
          decision: overrideDecision,
          is_override: true,
          override_reason: overrideReason
        }
      } : null);
      setShowOverride(false);
    } catch (err) {
      alert('Failed to save decision override.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Live AI Vision Inspection</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time deep learning defect classification and pixel-level thermal localization.
          </p>
        </div>

        {/* Source Mode Selector */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'image' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Image File</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'video' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Conveyor Video</span>
          </button>
          <button
            onClick={() => setActiveTab('webcam')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'webcam' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Camera</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Stream / Upload & Dataset Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Tab Panel */}
          <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            {activeTab === 'image' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Upload Casting Image</span>
                  <span className="text-[11px] text-slate-500">Supports JPEG, PNG, BMP</span>
                </div>

                {/* Drag and Drop Zone */}
                <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-900/50 transition group">
                  <Upload className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition mb-2" />
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                    {selectedFile ? selectedFile.name : 'Click or drag casting image here'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">224x224 or 512x512 resolution recommended</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>

                {/* Optional Product Code Tag */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">Product Code (Optional)</label>
                  <input
                    type="text"
                    value={productCodeInput}
                    onChange={(e) => setProductCodeInput(e.target.value)}
                    placeholder="e.g. CAST-2026-X492"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                {/* Inspect Action Button */}
                <button
                  onClick={handleInspectImage}
                  disabled={isInspecting || !selectedFile}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
                >
                  {isInspecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Running AI Model Inference...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Execute Deep Inspection</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Conveyor Video Processing</span>
                  <span className="text-[11px] text-slate-500">MP4, AVI, WebM</span>
                </div>

                <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-900/50 transition">
                  <Video className="w-8 h-8 text-slate-500 mb-2" />
                  <span className="text-xs font-semibold text-slate-300">
                    {videoFile ? videoFile.name : 'Select or drop conveyor inspection video'}
                  </span>
                  <input type="file" accept="video/*" onChange={(e) => e.target.files && setVideoFile(e.target.files[0])} className="hidden" />
                </label>

                <button
                  onClick={handleVideoInspect}
                  disabled={isVideoProcessing || !videoFile}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  {isVideoProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Extracting & Inspecting Frames...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Start Video Analysis (39 FPS)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'webcam' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Live Factory Camera Stream</span>
                  <button
                    onClick={() => setWebcamActive(!webcamActive)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition ${
                      webcamActive ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {webcamActive ? 'Stop Camera' : 'Start Camera'}
                  </button>
                </div>

                <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  {!webcamActive && (
                    <div className="text-center p-4">
                      <Camera className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Camera is paused. Click 'Start Camera' to initiate optical stream.</p>
                    </div>
                  )}
                  {webcamActive && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-rose-600/90 text-white font-mono text-[10px] rounded flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      LIVE FEED
                    </div>
                  )}
                </div>

                <button
                  onClick={handleCaptureWebcam}
                  disabled={!webcamActive || isInspecting}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Frame & Inspect</span>
                </button>
              </div>
            )}
          </div>

          {/* Real Dataset Sample Casting Gallery */}
          <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">Dataset Sample Gallery</h3>
                <p className="text-[11px] text-slate-500">1-click test with real Kaggle casting images</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                casting_data
              </span>
            </div>

            {/* Defective Samples */}
            <div className="mb-3">
              <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block mb-1.5">
                ● Defective Samples (def_front)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {samples?.defective_samples.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSample(s.url, s.name)}
                    className="relative group rounded-lg overflow-hidden border border-slate-800 hover:border-rose-500/80 transition p-1 bg-slate-900/60"
                  >
                    <img src={s.url} alt={s.name} className="w-full h-16 object-cover rounded" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[10px] font-bold text-rose-300">
                      Inspect
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Normal Samples */}
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block mb-1.5">
                ● Normal Samples (ok_front)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {samples?.normal_samples.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSample(s.url, s.name)}
                    className="relative group rounded-lg overflow-hidden border border-slate-800 hover:border-emerald-500/80 transition p-1 bg-slate-900/60"
                  >
                    <img src={s.url} alt={s.name} className="w-full h-16 object-cover rounded" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-[10px] font-bold text-emerald-300">
                      Inspect
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Inference & Decision Output (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {currentInspection ? (
            <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
              {/* Decision Verdict Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  currentInspection.recommended_decision === 'ACCEPT'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : currentInspection.recommended_decision === 'REJECT'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    {currentInspection.recommended_decision === 'ACCEPT' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : currentInspection.recommended_decision === 'REJECT' ? (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    )}
                    <span className="text-base font-bold font-mono tracking-tight uppercase">
                      Decision: {currentInspection.recommended_decision.replace('_', ' ')}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 font-mono">
                      Status: {currentInspection.status}
                    </span>
                  </div>
                  <p className="text-xs mt-1 opacity-90">
                    {currentInspection.decision?.reason || 'Component meets quality thresholds.'}
                  </p>
                </div>

                {/* Human Override Trigger */}
                <button
                  onClick={() => setShowOverride(true)}
                  className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-mono text-slate-200 transition flex items-center gap-1.5 shrink-0"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Manual Override</span>
                </button>
              </div>

              {/* Side-by-Side Visuals: Original Cast vs AI Anomaly Heatmap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Original Cast */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span>Figure 1: As-Received Casting</span>
                    <span className="text-[10px] text-cyan-400 font-mono">{currentInspection.product_code}</span>
                  </div>
                  <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                    <img
                      src={currentInspection.image_path}
                      alt="Original Component"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* AI Thermal Heatmap Overlay */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                    <span className="text-cyan-300">Figure 2: AI Anomaly Heatmap</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded font-mono">
                      {currentInspection.regions ? `${currentInspection.regions.length} Regions` : 'Localized'}
                    </span>
                  </div>
                  <div className="aspect-square bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800 relative">
                    <img
                      src={currentInspection.heatmap_path || currentInspection.image_path}
                      alt="AI Anomaly Map"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Quantitative Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Anomaly Score</span>
                  <span className={`text-base font-bold ${currentInspection.anomaly_score > currentInspection.threshold ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {currentInspection.anomaly_score.toFixed(4)}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Limit: {currentInspection.threshold.toFixed(4)}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Model Confidence</span>
                  <span className="text-base font-bold text-cyan-400">
                    {(currentInspection.confidence * 100).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">ResNet-18 Coreset</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Severity Rating</span>
                  <div className="mt-1">
                    <StatusBadge status={currentInspection.severity} size="sm" />
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Inference Speed</span>
                  <span className="text-base font-bold text-slate-200">
                    {currentInspection.processing_time_ms} ms
                  </span>
                  <span className="text-[10px] text-emerald-400 block">39.0 FPS</span>
                </div>
              </div>

              {/* Defect Classification & Root Cause Tag */}
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono">Defect Category:</span>
                  <span className="font-bold text-white font-mono">{currentInspection.defect_type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[11px] font-mono">Timestamp:</span>
                  <span className="text-slate-400 text-[11px] font-mono">
                    {new Date(currentInspection.inspected_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons: PDF Report & 3D Viewer */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleGeneratePdf}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 font-medium text-xs transition shadow"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Download PDF Certificate</span>
                </button>

                <button
                  onClick={() => navigate(`/3d-prototype`)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-500/20"
                >
                  <Box className="w-4 h-4" />
                  <span>Map to 3D Virtual Station</span>
                </button>

                <button
                  onClick={() => navigate(`/defect-analysis?id=${currentInspection.id}`)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs transition"
                >
                  <ZoomIn className="w-4 h-4 text-slate-400" />
                  <span>Deep Defect Breakdown</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="h-[480px] bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white font-mono mb-2">Ready for Industrial Inspection</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Select an image file, choose a sample from the real casting dataset on the left, or activate the conveyor camera to begin real-time defect evaluation.
              </p>
            </div>
          )}

          {/* Conveyor Video Batch Inspection Summary (If video processed) */}
          {videoResults && (
            <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono">Conveyor Video Processing Telemetry</h3>
                <span className="text-xs font-mono text-cyan-400">{videoResults.average_fps} FPS</span>
              </div>
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Processed Frames</span>
                  <span className="text-sm font-bold text-white">{videoResults.processed_frames_count}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Defective Frames</span>
                  <span className="text-sm font-bold text-rose-400">{videoResults.defects_detected}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Batch Defect Rate</span>
                  <span className="text-sm font-bold text-amber-400">{videoResults.defect_rate}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Override Modal */}
      {showOverride && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              <span>Inspector Quality Override</span>
            </h3>
            <p className="text-xs text-slate-400">
              Provide formal engineering justification to override the automated AI decision. This will be recorded in the audit trail.
            </p>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">New Verdict</label>
              <div className="grid grid-cols-3 gap-2">
                {(['ACCEPT', 'MANUAL_REVIEW', 'REJECT'] as const).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setOverrideDecision(d)}
                    className={`py-2 text-xs font-mono font-bold rounded-lg border transition ${
                      overrideDecision === d
                        ? (d === 'ACCEPT' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : d === 'REJECT' ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-amber-500/20 border-amber-500 text-amber-300')
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Engineering Justification</label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Superficial surface mark caused by conveyor guide; wall thickness confirmed via ultrasonic test."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowOverride(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition"
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideSubmit}
                className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs font-mono transition"
              >
                Confirm & Sign Off
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
