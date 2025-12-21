import { useTranslation } from 'react-i18next';
import { HandleLinkIcon } from '../../../System/Elements/Handlers';
import { I_PLUS } from '../../../System/UI/IconPack';

const Links = ({ handlePartitionClick, accountData }) => {
    const { t } = useTranslation();

    return (
        <div className="Settings-CP_Input_container">
            <div className="Title">{t('links')}</div>
            <div className="UI-Links">
                <button
                    onClick={() => {
                        handlePartitionClick({ type: 'add_link' });
                    }}
                >
                    <I_PLUS />
                    {t('add_button')}
                </button>
                {
                    accountData?.links?.length > 0 &&
                    accountData.links.slice().sort((a, b) => b.id - a.id).map((link) => (
                        <button
                            key={link.id}
                            onClick={() => {
                                handlePartitionClick({
                                    type: 'edit_link',
                                    params: { link: link }
                                });
                            }}
                        >
                            <HandleLinkIcon link={link.url} />
                            {link.title}
                        </button>
                    ))
                }
            </div>
        </div>
    )
}

export default Links;
