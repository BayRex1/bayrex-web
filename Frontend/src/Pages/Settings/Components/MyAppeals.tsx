import { I_REPORT } from '../../../System/UI/IconPack';
import { useModalsStore } from '../../../Store/modalsStore';

const MyAppeals = () => {
    const { openModal } = useModalsStore();

    const handleOpenMyAppeals = () => {
        openModal({
            type: 'my_appeals'
        });
    };

    return (
        <div onClick={handleOpenMyAppeals} className="Settings-LinkAction">
            <div className="Settings-Link_Icon">
                <I_REPORT />
            </div>
            <div className="Settings-Link_Data">
                <div className="Name">Мои апелляции</div>
                <div className="Desc">Просмотр поданных апелляций на ограничения</div>
            </div>
        </div>
    );
};

export default MyAppeals;
