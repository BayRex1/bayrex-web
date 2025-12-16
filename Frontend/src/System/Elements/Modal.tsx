import { motion, AnimatePresence, Variants } from 'framer-motion';
import { I_CLOSE } from '../UI/IconPack';
import classNames from 'classnames';
import { Backdrop } from '../../UIKit/Components/Modals/Backdrop';

export const Modal: React.FC = () => null;

interface UniversalPanelProps {
  className?: string;
  children: React.ReactNode;
  isOpen: boolean;
}

export const UniversalPanel: React.FC<UniversalPanelProps> = ({ className = '', children, isOpen }) => {
  const variants: Variants = {
    open: {
      opacity: 1,
      visibility: 'visible'
    },
    closed: {
      opacity: 0,
      visibility: 'hidden'
    },
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`UI-UniversalPanel ${className}`}
          variants={variants}
          initial="closed"
          animate="open"
          exit="closed"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface WindowProps {
  title: string;
  content: React.ReactNode;
  className?: string;
  contentClass?: string;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

export const Window: React.FC<WindowProps> = ({ title, content, className = '', contentClass = '', style, contentStyle, isOpen, setOpen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Backdrop />
          <motion.div
            className={classNames('UI-ActionWindow', className)}
            style={style}
            initial={{ opacity: 0, visibility: 'visible' }}
            animate={{ opacity: 1, visibility: 'visible' }}
            exit={{ opacity: 0, visibility: 'hidden' }}
          >
            <div className="TopBar">
              <div className="Title">{title}</div>
              <button onClick={() => setOpen(false)}>
                <I_CLOSE />
              </button>
            </div>
            <div className={classNames('UI-AW_Content', contentClass)} style={contentStyle}>
              {content}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
