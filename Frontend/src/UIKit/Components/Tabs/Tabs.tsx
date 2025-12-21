import { useState } from 'react';
import classNames from 'classnames';

interface TabsProps {
    tabs: { title: string }[];
    select: (i: number) => void;
    className?: string;
}

const Tabs = ({ tabs, select, className }: TabsProps) => {
    const [activeTab, setActiveTab] = useState(0);

    const selectTab = (i) => {
        setActiveTab(i);
        select(i);
    }

    return (
        <div className={classNames('UI-Tabs', className)}>
            {tabs.map((tab, i) => (
                <button
                    key={i}
                    className={classNames('Tab', i === activeTab && 'ActiveTab')}
                    onClick={() => { selectTab(i) }}
                >
                    {tab.title}
                </button>
            ))}
        </div>
    )
}

export default Tabs;
