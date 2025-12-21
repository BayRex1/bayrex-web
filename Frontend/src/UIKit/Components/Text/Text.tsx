import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { HandleText } from '../../../System/Elements/Handlers';

const PREVIEW_LENGTH = 700;
const MAX_PREVIEW_LENGTH = 4000;
const COLLAPSED_MAX_HEIGHT = '400px';

const Text: React.FC<{ text: string }> = ({ text }) => {
    const [expanded, setExpanded] = useState(false);

    const fullTextPhysical = useMemo(() => {
        if (text.length <= MAX_PREVIEW_LENGTH) {
            return text;
        }
        const idx = text.indexOf(' ', MAX_PREVIEW_LENGTH);
        if (idx === -1) {
            return text.slice(0, MAX_PREVIEW_LENGTH) + '...';
        }
        return text.slice(0, idx) + '...';
    }, [text]);

    const textToRender = expanded ? text : fullTextPhysical;

    if (!text) {
        return null;
    }

    const shouldHideCss = !expanded && text.length > PREVIEW_LENGTH;

    return (
        <motion.div
            className="Text"
            style={{ 
                overflow: 'hidden', 
                paddingBottom: text.length > PREVIEW_LENGTH ? expanded ? 30 : 0 : 0
            }}
            layout
            initial={false}
            transition={{ duration: 0.3 }}
        >
            <div
                style={{
                    maxHeight: shouldHideCss ? COLLAPSED_MAX_HEIGHT : 'none',
                    overflow: 'hidden'
                }}
            >
                <HandleText text={textToRender} />
            </div>

            {text.length > PREVIEW_LENGTH && (
                <div className="ShowMore">
                    <button
                        onClick={() => setExpanded(prev => !prev)}
                        aria-expanded={expanded}
                    >
                        {expanded ? 'Свернуть' : 'Полный текст'}
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default Text;
