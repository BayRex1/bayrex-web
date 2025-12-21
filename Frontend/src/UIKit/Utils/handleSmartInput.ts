import { ChangeEvent, FormEvent } from 'react';

const substitutions: Record<string, string> = {
    '<<': '«',
    '>>': '»',
};

type InputElement = HTMLInputElement | HTMLTextAreaElement;

const handleSmartInput = (
    e: FormEvent<InputElement> | ChangeEvent<InputElement>,
    setValue: (newValue: string) => void
) => {
    const el = e.target as InputElement;
    const cursorPos = el.selectionStart;
    let text = el.value;
    let replaced = false;

    for (const [trigger, replacement] of Object.entries(substitutions)) {
        const len = trigger.length;
        if (cursorPos >= len) {
            const slice = text.slice(cursorPos - len, cursorPos);
            if (slice === trigger) {
                text =
                    text.slice(0, cursorPos - len) +
                    replacement +
                    text.slice(cursorPos);
                const newPos = cursorPos - len + replacement.length;
                requestAnimationFrame(() => {
                    el.selectionStart = el.selectionEnd = newPos;
                });
                replaced = true;
                break;
            }
        }
    }

    setValue(text);
};

export default handleSmartInput;
