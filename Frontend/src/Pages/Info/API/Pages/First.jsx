import API from '../../../../Configs/API';
import BaseConfig from '../../../../Configs/Base';
import { ApiCode, CopyTextBox } from '../../../../UIKit';

const First = () => {
    return (
        <>
            <div className="BigText">Обратите внимание, что тут описано не всё API, но постепенно оно будет обновляться.</div>
            <div className="BigText">
                Давайте для начала разберём как работает соединение с WebSocket, мы не используем обычные WebSocket, у нас помимо
                wss соединения используется RSA + AES шифрование, а так же <a href="https://msgpack.org/">MessagePack</a> для передачи бинарных данных.
                Пример того как это всё происходит в чистом вебе можно скачать <a href="/static_sys/Demo/Element WS TEST.7z">тут</a>,
                вы можете взять код оттуда и использовать его, или же написать с его примера на своём языке, который используете вы.
            </div>
            <div className="BigText">
                <h3>Актуальные домены WebSocket (могут меняться)</h3>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    marginTop: 10
                }}>
                    {
                        BaseConfig.domains.ws.map((url, i) => (
                            <CopyTextBox
                                key={i}
                                text={url}
                            />
                        ))
                    }
                </div>
            </div>
            <div className="BigText">
                <h3>Вход в аккаунт</h3>
                Теперь давайте войдём в аккаунт с помощью API:
            </div>
            <ApiCode
                code={API.Auth.Login}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "S_KEY": "ваш ключ сессии"
}`}
            />
            <div className="BigText">
                Далее, исходя из того что нам пришло, сохраняем S_KEY, и начинаем новую сессию с сокетом, с помощью
                команды 'connect', вот пример как это реализовано в веб версии Элемента:
            </div>
            <ApiCode
                code={API.Auth.Authorize}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "accountData": {
    "id": 123,
    "name": "Хароми",
    "username": "ivan",
    "email": "user@mail.com",
    "description": "Программист, любитель кошек и хорошей музыки",
    "avatar": "https://elemsocial.com/files/avatars/123.jpg",
    "cover": "https://elemsocial.com/files/covers/123.jpg",
    "messenger_notifications": 2,
    "notifications": 5,
    "create_date": "2022-05-12T10:15:30Z",
    "last_online": "2023-10-15T18:45:22Z"
  }
}`}
            />
            <div className="BigText">
                В идеале мы должны через 'connect' получить данные аккаунта, если вам вернуло ошибку, то
                скорее всего сессия (S_KEY) не действительна.
            </div>
            <div className="BigText">
                <h3>Регистрация</h3>
                Если вы хотите сделать регистрацию, то вам понадобиться использовать HCaptcha с ключом 29c6b1c2-7e78-43ec-8bf8-5de49c58c54a,
                чтобы получить ответ от капчи и аккаунт был создан, вот пример кода как это реализовано в веб версии Элемента:
            </div>
            <ApiCode
                code={API.Auth.Reg}
            />
            <div className="BigText">
                <h4>Пример ответа</h4>
            </div>
            <ApiCode
                code={`{
  "status": "success",
  "S_KEY": "ваш ключ сессии"
}`}
            />
        </>
    )
}

export default First;