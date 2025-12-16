import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

let globalDragActive = false;
let dragDropAreas: HTMLDivElement[] = [];
let dragCounter = 0; 

export const registerDragDropArea = (ref: HTMLDivElement | null) => {
    if (ref && !dragDropAreas.includes(ref)) {
        dragDropAreas.push(ref);
    }
};

export const unregisterDragDropArea = (ref: HTMLDivElement | null) => {
    if (ref) {
        dragDropAreas = dragDropAreas.filter(area => area !== ref);
    }
};

const activateAllDragAreas = () => {
    dragDropAreas.forEach(area => {
        area.classList.add('global-drag');
    });
};

const deactivateAllDragAreas = () => {
    dragDropAreas.forEach(area => {
        area.classList.remove('global-drag');
    });
};

const handleGlobalDragEnter = (e: DragEvent) => {
    e.preventDefault();
    dragCounter++;
    
    if (!globalDragActive && e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        globalDragActive = true;
        activateAllDragAreas();
    }
};

const handleGlobalDragLeave = (e: DragEvent) => {
    e.preventDefault();
    dragCounter--;
    
    if (dragCounter <= 0) {
        dragCounter = 0;
        globalDragActive = false;
        deactivateAllDragAreas();
    }
};

const handleGlobalDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (globalDragActive && e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        activateAllDragAreas();
    }
};

const handleGlobalDrop = (e: DragEvent) => {
    e.preventDefault();
    dragCounter = 0;
    globalDragActive = false;
    deactivateAllDragAreas();
};

const addGlobalHandlers = () => {
    if (typeof window !== 'undefined') {
        window.addEventListener('dragenter', handleGlobalDragEnter);
        window.addEventListener('dragleave', handleGlobalDragLeave);
        window.addEventListener('drop', handleGlobalDrop);
        window.addEventListener('dragover', handleGlobalDragOver);
    }
};

if (typeof window !== 'undefined') {
    addGlobalHandlers();
}

interface DragDropAreaProps {
    onFilesDrop: (files: FileList) => void;
    children: React.ReactNode;
    className?: string;
}

export const DragDropArea: React.FC<DragDropAreaProps> = ({ onFilesDrop, children, className = '' }) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const dropAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        registerDragDropArea(dropAreaRef.current);
        
        return () => {
            unregisterDragDropArea(dropAreaRef.current);
        };
    }, []);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) {
            setIsDragging(true);
        }
        return false;
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget === dropAreaRef.current) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        
        const dt = e.dataTransfer;
        
        const srcElement = e.target as HTMLElement;
        const isFromEmojiPicker = srcElement.closest('.UI-EmojiPicker') || 
                             e.dataTransfer.getData('text/plain').includes('emoji') ||
                             Boolean(dt.getData('is-emoji'));
        
        if (!isFromEmojiPicker && dt.files && dt.files.length > 0) {
            onFilesDrop(dt.files);
        }
        
        dragCounter = 0;
        globalDragActive = false;
    };

    return (
        <div 
            ref={dropAreaRef}
            className={`${className} ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-text={t('drag_files_here')}
        >
            {children}
        </div>
    );
}; 