import API from '../../../../Configs/API';
import { ApiCode } from '../../../../UIKit';

const Gifts = () => {
    return (
        <>
            <div className="BigText">
                Подарки позволяют отправлять пользователям или каналам красивые изображения за внутриигровую валюту.
            </div>
            <div className="BigText">
                <h3>Загрузка списка подарков</h3>
            </div>
            <ApiCode
                code={API.Gifts.LoadGifts}
            />
            <div className="BigText">
                <h3>Отправка подарка</h3>
            </div>
            <ApiCode
                code={API.Gifts.SendGift}
            />
        </>
    );
};

export default Gifts; 