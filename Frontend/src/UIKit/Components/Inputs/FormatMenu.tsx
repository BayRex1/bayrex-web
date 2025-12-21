import { memo, useEffect, useRef, useState } from 'react';
import '../../../System/UI/FormatMenu.scss';
import { I_FORMAT_BOLD, I_FORMAT_ITALIC, I_FORMAT_STRIKE, I_FORMAT_SPOILER, I_FORMAT_CODEBLOCK } from '../../../System/UI/IconPack';

type FormattingType = 'bold' | 'italic' | 'strike' | 'spoiler' | 'codeblock';

interface FormatMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onFormat: (type: FormattingType) => void;
  onClose: () => void;
}

const FormatMenu: React.FC<FormatMenuProps> = ({ isOpen, position, onFormat, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ x: position.x, y: position.y });
  
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      
      let x = position.x - (rect.width / 2);
      let y = position.y - rect.height - 5;
      
      if (x + rect.width > window.innerWidth) {
        x = window.innerWidth - rect.width - 10;
      }
      
      if (x < 10) {
        x = 10;
      }
      
      if (y < 10) {
        y = position.y + 20;
      }
      
      setMenuPos({ x, y });
    }
  }, [isOpen, position]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="format-menu" 
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${menuPos.x}px`,
        top: `${menuPos.y}px`,
        transform: 'none'
      }}
    >
      <button 
        className="format-button" 
        onClick={() => onFormat('bold')}
        title="Жирный"
      >
        <I_FORMAT_BOLD />
      </button>
      <button 
        className="format-button" 
        onClick={() => onFormat('italic')}
        title="Курсив"
      >
        <I_FORMAT_ITALIC />
      </button>
      <button 
        className="format-button" 
        onClick={() => onFormat('strike')}
        title="Зачеркнутый"
      >
        <I_FORMAT_STRIKE />
      </button>
      <button 
        className="format-button" 
        onClick={() => onFormat('spoiler')}
        title="Спойлер"
      >
        <I_FORMAT_SPOILER />
      </button>
      <button 
        className="format-button" 
        onClick={() => onFormat('codeblock')}
        title="Код"
      >
        <I_FORMAT_CODEBLOCK />
      </button>
    </div>
  );
};

export default memo(FormatMenu);
