import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Textarea, TextInput } from '../../../UIKit';
import { I_GIFT } from '../../../System/UI/IconPack';
import { useWebSocket } from '../../../System/Context/WebSocket';
import { useModalsStore } from '../../../Store/modalsStore';

const AddGift = ({ loadGifts }) => {
    const { t } = useTranslation();
    const { wsClient } = useWebSocket();
    const { openModal } = useModalsStore();

    const [giftImage, setGiftImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [giftName, setGiftName] = useState('');
    const [giftQuantity, setGiftQuantity] = useState('0');
    const [giftDescription, setGiftDescription] = useState('');
    const [giftPrice, setGiftPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!giftImage) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(giftImage);
        setPreviewUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [giftImage]);

    const handleSubmit = async () => {
        if (!giftImage) {
            openModal({
                type: 'alert',
                props: {
                    title: t('error'),
                    message: 'Изображение подарка не выбрано'
                }
            });
            return;
        }

        wsClient.send({
            type: 'social',
            action: 'dashboard/gifts/add',
            payload: {
                name: giftName,
                price: giftPrice,
                quantity: giftQuantity,
                description: giftDescription,
                image: new Uint8Array(await giftImage?.arrayBuffer()),
            }
        }).then((res) => {
            if (res.status === 'success') {
                setGiftImage(null);
                setPreviewUrl(null);
                setGiftName('');
                setGiftDescription('');
                setGiftPrice('');
                setGiftQuantity('0');
                setIsLoading(false);
                loadGifts();
            } else {
                setIsLoading(false);
                openModal({
                    type: 'alert',
                    props: {
                        title: t('error'),
                        message: res.message
                    }
                })
            }
        })
    };

    return (
        <div className="AddGift">
            <div className="UI-Block PreviewBlock">
                <label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files && setGiftImage(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                </label>
                <div className="Preview">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="фыр фыр"
                        />
                    ) : (
                        <div className="Icon">
                            <I_GIFT />
                        </div>
                    )}
                </div>
            </div>
            <div
                className="UI-Block"
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
                <TextInput
                    type="text"
                    placeholder={t('gifts.name')}
                    value={giftName}
                    onChange={(e) => setGiftName(e.target.value)}
                />
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                    <TextInput
                        type="text"
                        placeholder={t('price')}
                        value={giftPrice}
                        onChange={(e) => setGiftPrice(e.target.value)}
                        style={{ flexGrow: 1 }}
                    />
                    <div className="UI-Eball">Е</div>
                </div>
                <TextInput
                    type="text"
                    placeholder={t('gifts.quantity')}
                    value={giftQuantity}
                    onChange={(e) => setGiftQuantity(e.target.value)}
                />
                <Textarea
                    placeholder={t('gifts.description')}
                    value={giftDescription}
                    onChange={(e) => setGiftDescription(e.target.value)}
                />
            </div>
            <div className="Footer">
                <Button
                    title={t('add')}
                    buttonStyle="action"
                    onClick={handleSubmit}
                    isActive={!!giftName && !!giftQuantity && !!giftPrice && !!giftImage}
                    isLoading={isLoading}
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );
}

export default AddGift;
