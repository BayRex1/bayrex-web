import classNames from 'classnames';
import { LeftBar, TopBar } from '../Components/Navigate';
import { useSelector } from 'react-redux';

const MainLayout = ({ className, children }) => {
    const isBottomPanelHidden = useSelector((state: any) => state.ui.bottomPanelHidden);

    return (
        <>
            <TopBar search={true} />
            <div className="Content">
                {
                    !isBottomPanelHidden && (
                        <LeftBar />
                    )
                }
                <div className={classNames('UI-PAGE_BODY', className)}>
                    {children}
                </div>
            </div>
        </>
    );
}

export default MainLayout;