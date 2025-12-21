import { AnimatePresence, motion } from 'framer-motion';

const QuestionModal = ({ input, target, set, onApply }) => {
  const variants = {
    show: {
      transform: 'translate(0) scale(1)',
      opacity: 1,
      top: 5,
      zIndex: -1,
      boxShadow: 'rgb(64 62 62) 0px 1px 5px -3px'
    },
    hidden: {
      transform: 'translate(0) scale(0.5)',
      opacity: 0,
      top: -40,
      zIndex: 1,
      boxShadow: '0px 0px 0px 0px rgb(114 114 114 / 50%)'
    },
  }

  return (
    <div className="UI-QuestionModal">
      <AnimatePresence>
        {
          input !== target && (
            <motion.div
              className="Question"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={variants}
            >
              <button className="Apply" onClick={onApply}>
                Применить
              </button>
              <button className="Back" onClick={() => set(target)}>
                Отменить
              </button>
            </motion.div>
          )
        }
      </AnimatePresence>
    </div>
  )
}

export default QuestionModal;