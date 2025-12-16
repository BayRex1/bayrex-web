import { useEffect, useState } from 'react';

// Тут происходит эффект взрыва, это не лишний файл, клянусь

export const createExplosionEffect = (
  element: HTMLElement,
  particleCount: number = 30,
  colors?: string[]
) => {
  if (!element) return;

  const rect = element.getBoundingClientRect();
  const container = document.createElement('div');
  container.className = 'ParticleContainer';
  document.body.appendChild(container);

  if (!colors || colors.length === 0) {
    const computedStyle = window.getComputedStyle(element);
    colors = [
      computedStyle.backgroundColor,
      computedStyle.color,
      computedStyle.borderColor
    ].filter(color => color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent');
    
    if (colors.length === 0) {
      colors = ['var(--BLOCK_COLOR)', 'var(--TEXT_COLOR)'];
    }
  }

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    
    const isImageParticle = Math.random() > 0.7 && element.tagName === 'IMG';
    
    if (isImageParticle) {
      particle.className = 'UI-ImageParticle';
      
      const miniImg = document.createElement('img');
      miniImg.src = (element as HTMLImageElement).src;
      miniImg.style.width = '100%';
      miniImg.style.height = '100%';
      miniImg.style.objectFit = 'cover';
      particle.appendChild(miniImg);
    } else {
      particle.className = 'UI-Particle';
      particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    }
    
    const size = Math.random() * 7 + 3;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    const x = rect.left + Math.random() * rect.width;
    const y = rect.top + Math.random() * rect.height;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    const xDistance = (Math.random() - 0.5) * 200;
    const yDistance = (Math.random() - 0.5) * 200;
    particle.style.setProperty('--x', String(xDistance));
    particle.style.setProperty('--y', String(yDistance));
    
    container.appendChild(particle);
  }
  
  setTimeout(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }, 1500);
};

export const useExplosionEffect = () => {
  return { createExplosionEffect };
};


interface ExplosionWrapperProps {
  children: React.ReactNode;
  onRemove: () => void;
  isVisible: boolean;
}

export const ExplosionWrapper: React.FC<ExplosionWrapperProps> = ({ 
  children, 
  onRemove,
  isVisible
}) => {
  const [wrapperRef, setWrapperRef] = useState<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (!isVisible && wrapperRef) {
      createExplosionEffect(wrapperRef);
      setTimeout(onRemove, 100);
    }
  }, [isVisible, wrapperRef, onRemove]);
  
  return (
    <div ref={setWrapperRef} style={{ display: isVisible ? 'block' : 'none' }}>
      {children}
    </div>
  );
}; 