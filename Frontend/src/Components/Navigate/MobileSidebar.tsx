import { useAuth } from '../../System/Hooks/useAuth';
import { useWebSocket } from '../../System/Context/WebSocket';
import { MobileSidebarMenu } from '../../UIKit';
import { memo } from 'react';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
    const { accountData, accounts, switchAccount, deleteAccount } = useAuth();
    const { wsClient } = useWebSocket();

    const handleLogout = () => {
        wsClient.send({
            type: 'authorization',
            action: 'logout',
            S_KEY: accountData.S_KEY
        });
        deleteAccount(accountData.id);
        localStorage.removeItem('S_KEY');
        window.location.href = '/auth';
    };

    return (
        <MobileSidebarMenu
            isOpen={isOpen}
            onClose={onClose}
            accountData={accountData}
            accounts={accounts}
            switchAccount={switchAccount}
            deleteAccount={deleteAccount}
            onLogout={handleLogout}
        />
    );
};

export default memo(MobileSidebar); 
