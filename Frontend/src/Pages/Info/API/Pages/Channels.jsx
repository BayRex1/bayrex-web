import API from '../../../../Configs/API';
import { ApiCode } from '../../../../UIKit';

const Channels = () => {
    return (
        <>
            <div className="BigText">
                Каналы - это как вторые профили, с них можно отправлять посты, но нельзя оставлять комментарии, ставить лайки, и тд,
            </div>
            <div className="BigText">
                <h3>Создание канала</h3>
                Для начала, научимся их создавать, вот как это реализовано в веб версии Элемента:
            </div>
            <ApiCode
                code={API.Channels.Create}
            />
            <div className="BigText">
                <h3>Редактирование канала</h3>
                Канал мы создали, ну и что дальше? А если я хочу изменить имя, уникальное имя и тд?
            </div>
            <div className="BigText">
                Всё очень просто, тут похожая система как с редактированием своего аккаунта, но нужно отправлять 'channel_id'.
            </div>
            <div className="BigText">
                <h3>Изменение имени</h3>
            </div>
            <ApiCode
                code={API.Channels.ChangeName}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "name": "Хароми"
}`}
            />
            <div className="BigText">
                <h3>Изменение уникального имени</h3>
            </div>
            <ApiCode
                code={API.Channels.ChangeUsername}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "username": "qwerty1"
}`}
            />
            <div className="BigText">
                <h3>Изменение описания канала</h3>
            </div>
            <ApiCode
                code={API.Channels.ChangeDescription}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "description": "Всем привет! это канал..."
}`}
            />
            <div className="BigText">
                <h3>Изменение аватара</h3>
            </div>
            <ApiCode
                code={API.Channels.ChangeAvatar}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "avatar": "https://elemsocial.com/files/avatars/ch123.jpg"
}`}
            />
            <div className="BigText">
                <h3>Изменение обложки</h3>
            </div>
            <ApiCode
                code={API.Channels.ChangeCover}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "cover": "https://elemsocial.com/files/covers/ch123.jpg"
}`}
            />
        </>
    )
}

export default Channels;