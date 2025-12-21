import { useEffect, useState } from 'react';
import { HandleFileSize } from '../../../System/Elements/Handlers';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { I_REPORT } from '../../../System/UI/IconPack';
import { useModalsStore } from '../../../Store/modalsStore';

const formatName = (path) => {
    switch (path) {
        case 'temp': return 'Временные файлы';
        case 'simple': return 'Простые файлы';
        case 'apps': return 'Приложения';
        case 'posts': return 'Посты';
        case 'comments': return 'Комментарии';
        case 'messenger': return 'Мессенджер';
        case 'avatars': return 'Аватары';
        case 'covers': return 'Обложки';
        case 'music': return 'Музыка';
        case 'images': return 'Изображения';
        case 'videos': return 'Видео';
        case 'files': return 'Файлы';
        case 'pools': return 'Склад';
        case 'icons': return 'Иконки';
        default:
            return path.charAt(0).toUpperCase() + path.slice(1);
    }
};

const colors = {
    apps: '#2F80ED',
    avatars: '#27AE60',
    covers: '#9B51E0',
    posts: '#F2994A',
    comments: '#56CCF2',
    messenger: '#EB5757',
    music: '#F2C94C',
    simple: '#6B7280',
    temp: '#BB6BD9',
    images: '#38B2AC',
    files: '#805AD5',
    videos: '#DD6B20',
    pools: '#4299E1'
};

const Statistic = () => {
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore();
    const [storage, setStorage] = useState<any>([]);
    const [storageSpace, setStorageSpace] = useState<any>(0);
    const [statistic, setStatistic] = useState<any>(null);

    useEffect(() => {
        wsClient.send({
            type: 'social',
            action: 'dashboard/statistic',
        }).then((res) => {
            setStatistic(res.statistic || {});
            setStorage(Array.isArray(res.storage) ? res.storage : []);
            setStorageSpace(res.storage_space || 0);
        })
    }, [wsClient]);

    const totalSize = storage.reduce((sum, entry) => sum + (entry.size || 0), 0);

    return (
        <>
            <div className="Dashboard-Blocks UI-B_FIRST">
                <div className="Dashboard-Block UI-Block">
                    <div className="Dashboard-B_Text">Зарегистрировано пользователей</div>
                    <div className="Dashboard-B_Count">
                        {statistic?.users}
                    </div>
                    <svg viewBox="0 0 42 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M24.1429 19.0141C29.3501 19.0141 33.5715 14.7928 33.5715 9.58551C33.5715 4.37824 29.3501 0.156921 24.1429 0.156921C18.9356 0.156921 14.7143 4.37824 14.7143 9.58551C14.7143 14.7928 18.9356 19.0141 24.1429 19.0141Z"></path><path d="M7 33.1569C7 27.3563 10.8414 22.4528 16.119 20.8517C18.375 22.4819 21.1468 23.4427 24.1429 23.4427C27.139 23.4427 29.9107 22.4819 32.1668 20.8517C37.4444 22.4528 41.2858 27.3563 41.2858 33.1569H7Z"></path><path d="M7 9.15692H5V14.1569H0V16.1569H5V21.1569H7V16.1569H12V14.1569H7V9.15692Z"></path></svg>
                </div>
                <div className="Dashboard-Block UI-Block">
                    <div className="Dashboard-B_Text">Опубликовано песен</div>
                    <div className="Dashboard-B_Count">
                        {statistic?.songs}
                    </div>
                    <svg viewBox="0 0 39 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 0H7V5H12V7H7V12H5V7H0V5H5V0Z"></path><path fillRule="evenodd" clipRule="evenodd" d="M27 17.5C27 19.9853 24.9853 22 22.5 22C20.0147 22 18 19.9853 18 17.5C18 15.0147 20.0147 13 22.5 13C24.9853 13 27 15.0147 27 17.5ZM25 17.5C25 18.8807 23.8807 20 22.5 20C21.1193 20 20 18.8807 20 17.5C20 16.1193 21.1193 15 22.5 15C23.8807 15 25 16.1193 25 17.5Z"></path><path fillRule="evenodd" clipRule="evenodd" d="M6.37196 14C6.12831 15.1281 6 16.299 6 17.5C6 26.6127 13.3873 34 22.5 34C31.6127 34 39 26.6127 39 17.5C39 8.3873 31.6127 1 22.5 1C19.3909 1 16.4826 1.85995 14 3.35498V9H9V14H6.37196ZM29 17.5C29 21.0899 26.0899 24 22.5 24C18.9101 24 16 21.0899 16 17.5C16 13.9101 18.9101 11 22.5 11C26.0899 11 29 13.9101 29 17.5Z"></path></svg>
                </div>
                <div className="Dashboard-Block UI-Block">
                    <div className="Dashboard-B_Text">Отправлено уведомлений</div>
                    <div className="Dashboard-B_Count">
                        {statistic?.notifications}
                    </div>
                    <svg viewBox="0 0 27 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M16.0147 2.74475C16.4553 1.10029 18.1456 0.124398 19.7901 0.565031C21.4346 1.00566 22.4104 2.69596 21.9698 4.34042L21.5821 5.78734C25.27 8.131 27.1829 12.6756 25.9921 17.1197L24.1304 24.0674C25.7749 24.508 26.7508 26.1983 26.3102 27.8428C25.8695 29.4872 24.1792 30.4631 22.5348 30.0225L2.68439 24.7036C1.03993 24.263 0.0640345 22.5727 0.504668 20.9282C0.945301 19.2837 2.63559 18.3078 4.28006 18.7485L6.14167 11.8009C7.33248 7.35669 11.2614 4.3774 15.627 4.19167L16.0147 2.74475ZM19.9848 3.80853L19.7057 4.85006C19.3879 4.73018 19.0613 4.62486 18.7263 4.53511C18.3913 4.44535 18.0558 4.37323 17.7207 4.31817L17.9997 3.27664C18.1466 2.72847 18.71 2.40319 19.2582 2.55007C19.8064 2.69695 20.1317 3.26036 19.9848 3.80853Z"></path><path d="M11.0139 33.3182C8.8213 32.7306 7.5201 30.4769 8.10761 28.2843L16.0478 30.4119C15.4603 32.6045 13.2065 33.9057 11.0139 33.3182Z"></path></svg>
                </div>
                <div className="Dashboard-Block UI-Block">
                    <div className="Dashboard-B_Text">Опубликовано постов</div>
                    <div className="Dashboard-B_Count">
                        {statistic?.posts}
                    </div>
                    <svg viewBox="0 0 37 34" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9.02655 1.00071C7.95962 0.714829 6.86295 1.34799 6.57706 2.41493L0.513301 25.0452C0.227417 26.1121 0.860582 27.2088 1.92751 27.4947L24.5578 33.5584C25.6247 33.8443 26.7214 33.2112 27.0073 32.1442L29.7188 22.0247L19.457 27.9493L15.0251 28.2154C13.0735 28.3325 11.8257 26.1713 12.903 24.5398L15.3493 20.8346L15.8132 20.5668L7.07346 18.225C6.46379 18.0616 6.10198 17.4349 6.26534 16.8253C6.4287 16.2156 7.05538 15.8538 7.66505 16.0171L18.6126 18.9505L21.4121 17.3343L8.25665 13.8093C7.64697 13.6459 7.28516 13.0192 7.44852 12.4096C7.61189 11.7999 8.23856 11.4381 8.84823 11.6014L24.2115 15.718L27.0109 14.1018L9.43981 9.39364C8.83014 9.23028 8.46833 8.60361 8.63169 7.99393C8.79505 7.38425 9.42172 7.02245 10.0314 7.18581L27.694 11.9185C28.2741 12.0739 28.6297 12.6487 28.5223 13.2292L32.1859 11.114C32.3572 11.0151 32.5325 10.93 32.7108 10.8583L33.071 9.51396C33.3569 8.44703 32.7237 7.35036 31.6568 7.06447L9.02655 1.00071Z"></path><path d="M16.7582 22.3305L14.572 25.6417C14.4028 25.8979 14.5988 26.2373 14.9053 26.2189L18.8659 25.9811L35.2936 16.4966C36.3017 15.9146 36.6471 14.6255 36.0651 13.6174C35.4831 12.6093 34.194 12.264 33.1859 12.846L16.7582 22.3305Z"></path></svg>
                </div>
                <div className="Dashboard-Block UI-Block">
                    <div className="Dashboard-B_Text">Оставлено комментариев</div>
                    <div className="Dashboard-B_Count">
                        {statistic?.comments}
                    </div>
                    <svg viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M34.0412 15.2731C35.2887 10.6174 32.5258 5.83188 27.8701 4.58438L13.8203 0.819743C9.16457 -0.427749 4.37908 2.33515 3.13159 6.99086L0.872806 15.4208C-0.374687 20.0765 2.38822 24.8619 7.04392 26.1094L19.6888 29.4976L21.7041 34.157L26.7456 29.4853C29.1391 28.4734 31.0577 26.4075 31.7824 23.703L34.0412 15.2731ZM16.8076 17.7705C15.5273 17.4274 14.7675 16.1114 15.1106 14.8311C15.4536 13.5508 16.7696 12.791 18.0499 13.1341C19.3303 13.4771 20.0901 14.7931 19.747 16.0735C19.4039 17.3538 18.0879 18.1136 16.8076 17.7705ZM7.38315 12.7606C7.04009 14.0409 7.79989 15.3569 9.0802 15.7C10.3605 16.043 11.6765 15.2832 12.0196 14.0029C12.3627 12.7226 11.6029 11.4066 10.3225 11.0635C9.04222 10.7205 7.72621 11.4802 7.38315 12.7606ZM24.535 19.8411C23.2547 19.498 22.4949 18.182 22.838 16.9017C23.181 15.6214 24.497 14.8616 25.7773 15.2046C27.0577 15.5477 27.8175 16.8637 27.4744 18.144C27.1313 19.4243 25.8153 20.1841 24.535 19.8411Z"></path></svg>
                </div>
                <div className="Dashboard-Block UI-Block">
                    <div className="Dashboard-B_Text">Поставлено лайков</div>
                    <div className="Dashboard-B_Count">
                        {statistic?.likes}
                    </div>
                    <svg viewBox="0 0 36 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.1883 31.1097C7.71292 26.2544 -1.65723 16.9673 0.883902 7.48365C2.28733 2.24598 7.671 -0.862283 12.9087 0.541146C16.2073 1.42502 18.6614 3.88765 19.6757 6.89826C22.0595 4.79816 25.416 3.89249 28.7147 4.77637C33.9524 6.1798 37.0607 11.5635 35.6572 16.8011C33.1161 26.2848 20.3578 29.6425 13.1883 31.1097Z"></path></svg>
                </div>
                <div className="Dashboard-Block UI-Block">
                    <div className="Dashboard-B_Text">Поставлено дизлайков</div>
                    <div className="Dashboard-B_Count">
                        {statistic?.dislikes}
                    </div>
                    <svg viewBox="0 0 36 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.8839 7.48365C-1.65723 16.9673 7.71292 26.2544 13.1883 31.1097C20.3578 29.6425 33.1161 26.2848 35.6572 16.8011C37.0607 11.5635 33.9524 6.1798 28.7147 4.77637C26.7621 4.25317 24.7892 4.35701 23.0098 4.96445L18.2706 12.1424L19.7377 19.3119L15.3059 23.2066L13.1883 31.1097L12.1447 22.3596L14.9959 18.0413L13.5287 10.8718L18.0909 3.96204C16.8249 2.34669 15.0437 1.11323 12.9087 0.541146C7.671 -0.862283 2.28733 2.24598 0.8839 7.48365Z"></path></svg>
                </div>
            </div>

            <div className="UI-PartitionName">Память</div>
            <div className="UI-Block">
                <div className="Panel-GroupedItem">
                    <div className="Panel-GroupedText">Всего занято</div>
                    <div className="Panel-GroupedValue">
                        <HandleFileSize bytes={totalSize} /> / <HandleFileSize bytes={storageSpace} />
                    </div>
                </div>

                <div className="OverallProgressContainer">
                    {storage.map((entry) => {
                        const key = entry.path;
                        const color = colors[key] || '#D1D5DB';
                        const percent = storageSpace > 0 ? (entry.size / storageSpace) * 100 : 0;
                        return (
                            <div
                                key={key}
                                className="OverallProgressSegment"
                                style={{ width: `${percent}%`, backgroundColor: color }}
                                title={`${formatName(key)}: ${percent.toFixed(1)}%`}
                            />
                        );
                    })}
                </div>

                {storage.map((entry) => {
                    const hasChildren = Array.isArray(entry.paths) && entry.paths.length > 0;
                    return (
                        <div key={entry.path} className="Panel-GroupedList">
                            <div className="Panel-GroupedItem">
                                <div className="Panel-GroupedText">
                                    <div className="UI-InfoBlock">
                                        <div
                                            className="UI-ColorIndicator"
                                            style={{
                                                backgroundColor: colors[entry.path] || '#D1D5DB',
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                marginLeft: 5,
                                                flexShrink: 0,
                                                boxShadow: '0 0 3px rgba(0, 0, 0, 0.2)'
                                            }}
                                        ></div>
                                        {formatName(entry.path)}
                                    </div>
                                </div>
                                <div className="Panel-GroupedValue">
                                    <HandleFileSize bytes={entry.size} />
                                </div>
                            </div>

                            {hasChildren && (
                                <>
                                    {entry.paths.map((sub) => (
                                        <div key={sub.path} className="Panel-GroupedSubItem">
                                            <div>{formatName(sub.path)}</div>
                                            <div>
                                                <HandleFileSize bytes={sub.size} />
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    )
}

export default Statistic;
