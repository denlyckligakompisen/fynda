// Generate iOS Splash Screen dynamically
if (/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())) {
  const canvas = document.createElement('canvas');
  canvas.width = window.screen.width * window.devicePixelRatio;
  canvas.height = window.screen.height * window.devicePixelRatio;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // App Name
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${40 * window.devicePixelRatio}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Fynda', canvas.width / 2, canvas.height / 2);

  const link = document.createElement('link');
  link.setAttribute('rel', 'apple-touch-startup-image');
  link.setAttribute('href', canvas.toDataURL('image/png'));
  document.head.appendChild(link);
}
