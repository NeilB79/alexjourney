import { SelectedItem, RenderSettings, DayKey } from '../types';
import { ASPECT_RATIOS } from '../constants';
import { parseDateKey } from './dateUtils';
import { format } from 'date-fns';

export const generateVideo = async (
  selections: Record<DayKey, SelectedItem>,
  sortedKeys: DayKey[],
  settings: RenderSettings,
  onProgress: (percent: number, status: string) => void
): Promise<Blob> => {
  const { width, height } = ASPECT_RATIOS[settings.aspectRatio];
  const fps = 30;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get 2D context');

  // 1. Pre-load all images
  onProgress(5, 'Loading images...');
  const images: Record<string, HTMLImageElement> = {};
  
  let loadedCount = 0;
  const totalImages = sortedKeys.length;

  for (const key of sortedKeys) {
    const item = selections[key];
    if (item) {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          images[key] = img;
          loadedCount++;
          onProgress(5 + (loadedCount / totalImages) * 15, `Loaded image ${loadedCount}/${totalImages}`);
          resolve();
        };
        img.onerror = () => {
            console.warn(`Failed to load image for ${key}`);
            resolve();
        };
        img.src = item.imageUrl;
      });
    }
  }

  // 2. Setup MediaRecorder
  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported('video/mp4; codecs="avc1.424028, mp4a.40.2"') 
    ? 'video/mp4; codecs="avc1.424028, mp4a.40.2"'
    : 'video/webm; codecs=vp9';
  
  const recorder = new MediaRecorder(stream, { 
    mimeType,
    videoBitsPerSecond: 5000000 // 5 Mbps
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
  });

  recorder.start();

  // 3. Animation Loop
  onProgress(20, 'Rendering frames...');
  
  const framesPerSlide = Math.round(settings.durationPerSlide * fps);
  const transitionFrames = settings.transition === 'crossfade' ? Math.round(0.5 * fps) : 0;
  
  // Helper to draw a single frame
  const drawFrame = (img: HTMLImageElement | null, opacity: number, dateKey: string) => {
    // Clear background
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    if (img) {
      ctx.globalAlpha = opacity;
      
      // Calculate Scale (Cover)
      const scale = Math.max(width / img.width, height / img.height);
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      
      let x = (width - scaledW) / 2;
      let y = (height - scaledH) / 2;
      
      // SMART CROP LOGIC:
      // If enabled, we assume faces are likely in the top portion.
      // Instead of centering vertically (50%), we anchor closer to the top (e.g. 20%).
      if (settings.smartCrop) {
          // If the image is taller than the canvas (relative to aspect), we can shift it up/down.
          if (scaledH > height) {
              // Anchor at 20% from the top of the image to align with typical "Rule of Thirds" for faces
              // But ensure we don't go out of bounds (gap at bottom).
              
              // Standard center y = (height - scaledH) / 2
              // Top align y = 0
              // Weighted: try to align the top 20% of image to top 20% of canvas? 
              // Simpler: Just shift center up by 15% of the excess height.
              const excess = scaledH - height;
              // Shift up by 30% of excess to bias towards top
              y = (height - scaledH) / 2 - (excess * 0.3);
              
              // Clamp so we don't show black bars on bottom or top
              if (y > 0) y = 0;
              if (y + scaledH < height) y = height - scaledH;
          }
      }

      ctx.drawImage(img, x, y, scaledW, scaledH);
      
      // Date Overlay
      if (settings.showDateOverlay) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(20, height - 80, 240, 60);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const dateObj = parseDateKey(dateKey);
        ctx.fillText(format(dateObj, 'MMM d, yyyy'), 40, height - 50);
      }
      
      ctx.globalAlpha = 1;
    }
  };

  // Render loop
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const img = images[key];
    const nextKey = sortedKeys[i + 1];
    const nextImg = nextKey ? images[nextKey] : null;

    if (!img) continue;

    for (let f = 0; f < framesPerSlide; f++) {
      const isTransitioning = nextImg && settings.transition === 'crossfade' && f >= (framesPerSlide - transitionFrames);
      
      if (isTransitioning) {
        const framesLeft = framesPerSlide - f;
        const progress = 1 - (framesLeft / transitionFrames);
        
        ctx.globalAlpha = 1;
        drawFrame(img, 1, key);

        ctx.globalAlpha = progress;
        drawFrame(nextImg, progress, nextKey);
        
        ctx.globalAlpha = 1;
      } else {
        drawFrame(img, 1, key);
      }

      if (f % 10 === 0) {
        await new Promise(r => setTimeout(r, 0));
        const totalFrames = sortedKeys.length * framesPerSlide;
        const currentFrameGlobal = (i * framesPerSlide) + f;
        onProgress(20 + (currentFrameGlobal / totalFrames) * 80, 'Rendering...');
      }
      
      await new Promise(r => setTimeout(r, 1000 / fps));
    }
  }

  onProgress(99, 'Finalizing...');
  recorder.stop();
  const blob = await recordingPromise;
  
  canvas.remove();
  
  return blob;
};