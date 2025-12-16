export const Animate = (obj, name, time) => {
  const element = document.querySelector(obj);
  if (!element) return;
  
  let speed = localStorage.getItem('S-AnimSpeed');
  if (speed) {
    speed = parseInt(speed);
    if (speed !== 5) {
      if (speed < 5) {
        time = time * speed * 0.2;
      } else {
        time = time * speed * 0.5;
      }
    }
  }
  element.style.animation = name + ' ' + time + 's forwards';
}
export const AnimateElement = (obj, name, time) => {
  let speed = localStorage.getItem('S-AnimSpeed');
  if (speed) {
    speed = parseInt(speed);
    if (speed !== 5) {
      if (speed < 5) {
        time = time * speed * 0.2;
      } else {
        time = time * speed * 0.5;
      }
    }
  }
  obj.style.animation = name + ' ' + time + 's forwards';
}

export const downloadBlob = (blob: Blob, filename: string = 'downloaded_file') => {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
      document.body.removeChild(link);
  }, 100);
};