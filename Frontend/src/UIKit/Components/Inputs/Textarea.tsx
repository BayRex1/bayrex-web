import { forwardRef, useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import handleSmartInput from '../../Utils/handleSmartInput';

type TextareaProps = {
    placeholder?: string;
    className?: string;
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onInput?: (event: React.FormEvent<HTMLTextAreaElement>) => void;
    maxLength?: number;
    transparent?: boolean;
    resize?: boolean;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            placeholder,
            className,
            value,
            onChange,
            onInput,
            maxLength,
            transparent = false,
            resize
        },
        ref
    ) => {
        const [internalValue, setInternalValue] = useState(value ?? '');

        useEffect(() => {
            if (value !== undefined && value !== internalValue) {
                setInternalValue(value);
            }
        }, [value, internalValue]);

        const handleInputEvent = useCallback(
            (e: React.FormEvent<HTMLTextAreaElement>) => {
                handleSmartInput(e, (newValue: string) => {
                    setInternalValue(newValue);
                    if (onChange) {
                        const syntheticEvent = {
                            ...e,
                            target: { ...e.target, value: newValue },
                        } as React.ChangeEvent<HTMLTextAreaElement>;
                        onChange(syntheticEvent);
                    }
                });

                if (onInput) {
                    onInput(e);
                }
            },
            [onChange, onInput]
        );

        return (
            <textarea
                ref={ref}
                placeholder={placeholder}
                className={classNames('UI-Input', className, {
                    'UI-Input--transparent': transparent,
                })}
                value={value !== undefined ? value : internalValue}
                onInput={handleInputEvent}
                maxLength={maxLength}
                style={{
                    resize: resize ? 'both' : 'none',
                }}
            />
        );
    }
);

export default Textarea;
