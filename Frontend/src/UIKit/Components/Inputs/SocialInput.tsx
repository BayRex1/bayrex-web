import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  ChangeEvent,
  KeyboardEvent,
  useLayoutEffect,
  ClipboardEvent,
  useCallback,
  memo,
} from 'react';
import handleSmartInput from '../../Utils/handleSmartInput';
import { isMobile } from 'react-device-detect';
import '../../../System/UI/SocialInput.scss';
import FormatMenu from './FormatMenu';

interface SocialInputProps {
  placeholder?: string;
  value: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onEnter?: () => void;
  onPaste?: (e: ClipboardEvent<HTMLTextAreaElement>) => void;
  maxLength?: number;
  simple?: boolean;
}

const SocialInput = forwardRef<HTMLTextAreaElement, SocialInputProps>(
  ({
    placeholder = '',
    value,
    onChange,
    onEnter,
    onPaste,
    maxLength,
    simple = false,
  }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [radius, setRadius] = useState<number>(100);
    const [internalValue, setInternalValue] = useState<string>(value);
    const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false);
    const [formatMenuPosition, setFormatMenuPosition] = useState({ x: 0, y: 0 });
    const [selection, setSelection] = useState({ start: 0, end: 0 });
    const mousePosition = useRef({ x: 0, y: 0 });

    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement, []);

    const trackMousePosition = useCallback((e: MouseEvent) => {
      mousePosition.current = { x: e.clientX, y: e.clientY };
    }, []);

    const checkSelection = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);

      if (selectedText && document.activeElement === textarea) {
        const selection = window.getSelection();

        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();

          if (rect.width > 0) {
            const centerX = rect.left + (rect.width / 2);
            const topY = rect.top - 1;

            setSelection({
              start: textarea.selectionStart,
              end: textarea.selectionEnd
            });

            setFormatMenuPosition({
              x: centerX,
              y: topY
            });

            setIsFormatMenuOpen(true);
            return;
          }
        }

        const textareaRect = textarea.getBoundingClientRect();
        const textareaTop = textareaRect.top;

        setSelection({
          start: textarea.selectionStart,
          end: textarea.selectionEnd
        });

        setFormatMenuPosition({
          x: mousePosition.current.x,
          y: textareaTop - 8
        });

        setIsFormatMenuOpen(true);
      } else if (!selectedText) {
        setIsFormatMenuOpen(false);
      }
    }, []);

    useEffect(() => {
      document.addEventListener('mousemove', trackMousePosition);

      const textarea = textareaRef.current;
      if (textarea) {
        textarea.addEventListener('mouseup', checkSelection);
        textarea.addEventListener('keyup', checkSelection);

        if (isMobile) {
          textarea.addEventListener('touchend', checkSelection);
        }
      }

      return () => {
        document.removeEventListener('mousemove', trackMousePosition);

        if (textarea) {
          textarea.removeEventListener('mouseup', checkSelection);
          textarea.removeEventListener('keyup', checkSelection);

          if (isMobile) {
            textarea.removeEventListener('touchend', checkSelection);
          }
        }
      };
    }, [checkSelection, trackMousePosition]);

    const resize = () => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight || '20') || 20;
      const rows = Math.max(5, Math.floor(el.scrollHeight / lineHeight));
      const newRadius = Math.max(10, 100 - (rows - 1) * 20);
      setRadius(newRadius);
    };

    useLayoutEffect(() => {
      resize();
    }, [internalValue]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      handleSmartInput(e, (newValue: string) => {
        setInternalValue(newValue);
        if (onChange) {
          const syntheticEvent = {
            ...e,
            target: { ...e.target, value: newValue },
          } as ChangeEvent<HTMLTextAreaElement>;
          onChange(syntheticEvent);
        }
      });
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        if (e.shiftKey || isMobile) {
          e.preventDefault();
          const el = e.currentTarget;
          const cursor = el.selectionStart;
          const newValue =
            internalValue.slice(0, cursor) + '\n' + internalValue.slice(cursor);
          if (onChange) {
            const syntheticEvent = {
              ...e,
              target: { ...el, value: newValue },
            } as unknown as ChangeEvent<HTMLTextAreaElement>;
            onChange(syntheticEvent);
          }
          setInternalValue(newValue);
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = cursor + 1;
          });
        } else {
          e.preventDefault();
          if (!isMobile) {
            onEnter?.();
          }
        }
      }
    };

    const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
      if (onPaste) {
        onPaste(e);
      }
    };

    const handleFormat = useCallback((type: 'bold' | 'italic' | 'strike' | 'spoiler' | 'codeblock') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = selection.start;
      const end = selection.end;
      const selectedText = internalValue.substring(start, end);

      let newText = internalValue;
      let newCursorPos = end;

      switch (type) {
        case 'bold':
          newText = internalValue.substring(0, start) + `__${selectedText}__` + internalValue.substring(end);
          newCursorPos = end + 4;
          break;
        case 'italic':
          newText = internalValue.substring(0, start) + `_${selectedText}_` + internalValue.substring(end);
          newCursorPos = end + 2;
          break;
        case 'strike':
          newText = internalValue.substring(0, start) + `~~${selectedText}~~` + internalValue.substring(end);
          newCursorPos = end + 4;
          break;
        case 'spoiler':
          newText = internalValue.substring(0, start) + `||${selectedText}||` + internalValue.substring(end);
          newCursorPos = end + 4;
          break;
        case 'codeblock':
          newText = internalValue.substring(0, start) +
            `\`\`\`\n${selectedText}\n\`\`\`` +
            internalValue.substring(end);
          newCursorPos = end + 7;
          break;
      }

      setInternalValue(newText);
      if (onChange) {
        const syntheticEvent = {
          target: { value: newText },
        } as unknown as ChangeEvent<HTMLTextAreaElement>;
        onChange(syntheticEvent);
      }

      setIsFormatMenuOpen(false);

      requestAnimationFrame(() => {
        if (textarea) {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        }
      });
    }, [internalValue, selection, onChange]);

    const closeFormatMenu = useCallback(() => {
      setIsFormatMenuOpen(false);
    }, []);

    return (
      <div className="SocialInput-container">
        <textarea
          className="UI-Input"
          ref={textareaRef}
          value={internalValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={1}
          style={{
            overflow: 'hidden',
            resize: 'none',
            transition: 'height 0.15s ease, border-radius 0.2s ease',
            borderRadius: simple ? '12px' : `${radius}px`,
          }}
        />

        {!simple && <FormatMenu
          isOpen={isFormatMenuOpen}
          position={formatMenuPosition}
          onFormat={handleFormat}
          onClose={closeFormatMenu}
        />}
      </div>
    );
  }
);

export default memo(SocialInput);
