import API from '../../../../Configs/API';
import { ApiCode } from '../../../../UIKit';

const AccountSettings = () => {
    return (
        <>
            <div className="BigText">Давайте научимся редактировать свой аккаунт, это работает почти так же, как и с каналами.</div>
            <div className="BigText">
                <h3>Смена имени</h3>
            </div>
            <ApiCode
                code={API.ChangeAccount.ChangeName}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "name": "BayRex"
}`}
            />
            <div className="BigText">
                <h3>Смена уникального имени</h3>
            </div>
            <ApiCode
                code={API.ChangeAccount.ChangeUsername}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "username": "qwerty"
}`}
            />
            <div className="BigText">
                <h3>Смена почты</h3>
            </div>
            <ApiCode
                code={API.ChangeAccount.ChangeEmail}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "email": "bayrex@epic.com"
}`}
            />
            <div className="BigText">
                <h3>Смена пароля</h3>
            </div>
            <ApiCode
                code={API.ChangeAccount.ChangePassword}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success"
}`}
            />
            <div className="BigText">
                <h3>Смена описания</h3>
            </div>
            <ApiCode
                code={API.ChangeAccount.ChangeDescription}
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
                <h3>Смена аватара</h3>
            </div>
            <ApiCode
                code={API.ChangeAccount.ChangeAvatar}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "avatar": "https://elemsocial.com/files/avatars/123.jpg"
}`}
            />
            <div className="BigText">
                <h3>Смена обложки</h3>
            </div>
            <ApiCode
                code={API.ChangeAccount.ChangeCover}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "cover": "https://elemsocial.com/files/covers/123.jpg"
}`}
            />
        </>
    )
}

export default AccountSettings;
