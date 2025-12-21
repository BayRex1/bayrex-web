import { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';

export interface Tab {
    title: string;
    content: React.ReactNode;
}

interface MaterialTabsProps {
    tabs?: Tab[] | any
}

const MaterialTabs: React.FC<MaterialTabsProps> = ({ tabs = [] }) => {
    const [activeTab, setActiveTab] = useState(0);
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        if (tabs.length === 0) return;
        if (activeTab >= tabs.length) {
            setActiveTab(0);
        }
    }, [tabs, activeTab]);

    useEffect(() => {
        const tab = tabsRef.current[activeTab];
        if (tab) {
            setIndicatorStyle({
                left: tab.offsetLeft,
                width: tab.offsetWidth,
            });
        }
    }, [activeTab, tabs]);

    return (
        tabs.length > 0 && (
            <div className="UI-MaterialTabs">
                <div className="UI-MaterialTabs-Header">
                    {tabs.map((tabItem, index) => (
                        <button
                            key={tabItem.title}
                            ref={(el) => {
                                tabsRef.current[index] = el;
                            }}
                            className={classNames('UI-MaterialTabs-Button', {
                                active: index === activeTab,
                            })}
                            onClick={() => setActiveTab(index)}
                        >
                            {tabItem.title}
                        </button>
                    ))}
                    <div
                        className="UI-MaterialTabs-Indicator"
                        style={indicatorStyle}
                    />
                </div>
                <div className="UI-MaterialTabs-Content">
                    {tabs[activeTab]?.content}
                </div>
            </div>
        )
    );
};

export default MaterialTabs;
