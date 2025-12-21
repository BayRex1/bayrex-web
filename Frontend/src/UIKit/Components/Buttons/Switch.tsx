import classNames from 'classnames';

const Switch = ({ checked, onChange }) => {
    return (
        <label className={classNames('UI-Switch', {
            'UI-Switch-On': checked,
        })}>
            <input type="checkbox" checked={checked} onChange={onChange} />
        </label>
    );
};

export default Switch;