import { useState } from 'react';

const CopyTextBox = ({ text, label = 'Скопировать' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Не удалось скопировать:', err);
        }
    };

    return (
        <div className="UI-CopyTextBox">
            <pre className="TextContent">{text}</pre>
            <button
                onClick={handleCopy}
                className="CopyButton"
            >
                {copied ? 'Скопировано' : label}
            </button>
        </div>
    );
};

export default CopyTextBox;
