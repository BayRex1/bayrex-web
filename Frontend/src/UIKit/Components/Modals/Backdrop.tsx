import { motion } from 'framer-motion';

interface BackdropProps {
    onClick?: () => void;
    style?: any
}

export const Backdrop = ({ onClick, style }: BackdropProps) => (
    <motion.div
        className="UI-Backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClick}
        style={style}
    />
);
