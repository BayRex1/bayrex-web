import { forwardRef, useState, useEffect, FormEvent, ClipboardEvent, useCallback, memo } from 'react';
import classNames from 'classnames';
import handleSmartInput from '../../Utils/handleSmartInput';

interface TextInputProps {
  value?: string;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  type?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onPaste?: (e: ClipboardEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  transparent?: boolean;
  style?: React.CSSProperties;
}

const TextInput = memo(
  forwardRef<HTMLInputElement, TextInputProps>((props, ref) => {
    const {
      value,
      placeholder,
      className,
      maxLength,
      onChange,
      name,
      type = 'text',
      onKeyDown,
      onPaste,
      readOnly,
      transparent = false,
      style
    } = props;

    const [internalValue, setInternalValue] = useState(value ?? '');

    useEffect(() => {
      if (value !== undefined && value !== internalValue) {
        setInternalValue(value);
      }
    }, [value, internalValue]);

    const handleInput = useCallback(
      (e: FormEvent<HTMLInputElement>) => {
        handleSmartInput(e, (newValue: string) => {
          setInternalValue(newValue);
          if (onChange) {
            const syntheticEvent = {
              ...e,
              target: { ...e.target, value: newValue },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          }
        });
      },
      [onChange]
    );

    const handlePasteEvent = useCallback(
      (e: ClipboardEvent<HTMLInputElement>) => {
        if (onPaste) onPaste(e);
      },
      [onPaste]
    );

    return (
      <input
        ref={ref}
        value={internalValue}
        placeholder={placeholder}
        type={type}
        className={classNames('UI-Input', className, {
          'UI-Input--transparent': transparent,
        })}
        autoComplete="off"
        maxLength={maxLength}
        name={name}
        onKeyDown={onKeyDown}
        onPaste={handlePasteEvent}
        readOnly={readOnly}
        onInput={handleInput}
        style={style}
      />
    );
  })
);

export default TextInput;
