import { GitHubButton } from '../../../UIKit';
import LottieAnimation from '../../../UIKit/Components/Base/LotteAnimation';

const Advantages = () => {
    return (
        <div className="UI-Block Info-Block UI-B_FIRST">
            <div className="UI-Title">Почему именно Element?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--PUSTOTA_WIDTH)' }}>
                <div className="Info-A_Block">
                    <div className="BlockContent">
                        <div className="Title">Современный и душевный интерфейс</div>
                        <div className="Description">
                            Был создан интерфейс с акцентом на удобство, которым хочется пользоваться: лёгкий, интуитивный, с акцентом на уют. Потому что главное — это комфорт использования.
                        </div>
                    </div>
                    <LottieAnimation className="Icon" url="/static_sys/Lottie/Fire.json" />
                </div>
                <div className="Info-A_Block">
                    <div className="BlockContent">
                        <div className="Title">Говори что хочешь</div>
                        <div className="Description">
                            У нас ценится свобода: без банов за мнение, без лишних правил. Просто будь собой и говори, что думаешь.
                        </div>
                    </div>
                    <LottieAnimation className="Icon" url="/static_sys/Lottie/Zipper.json" />
                </div>
                <div className="Info-A_Block">
                    <div className="BlockContent">
                        <div className="Title">Никаких следов</div>
                        <div className="Description">
                            Нам не интересны ваши данные. Никаких трекеров, никаких рекламных ловушек. Даже почта — это просто способ зайти. А хотите — и её не давайте.
                        </div>
                    </div>
                    <LottieAnimation className="Icon" url="/static_sys/Lottie/Comp 1.json" />
                </div>
                <div className="Info-A_Block">
                    <div className="BlockContent">
                        <div className="Title">Безопасность — это не шутка</div>
                        <div className="Description">
                            Все сообщения надёжно шифруются с помощью RSA + AES. Причём ключ — только у вас. Никто, кроме вас, не прочитает ваши разговоры. Даже мы.
                        </div>
                    </div>
                    <LottieAnimation className="Icon" url="/static_sys/Lottie/Key.json" />
                </div>
                <div className="Info-A_Block">
                    <div className="BlockContent">
                        <div className="Title">Открытый и честный</div>
                        <div className="Description">
                            BayRex — это не чёрный ящик. Исходный код доступен каждому. Хотите проверить, что под капотом? Добро пожаловать!
                        </div>
                        <div
                            style={{
                                marginTop: '15px',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '5px',
                            }}
                        >
                            <GitHubButton
                                title="Element"
                                link="https://github.com/Xaromie"
                            />
                        </div>
                    </div>
                    <LottieAnimation className="Icon" url="/static_sys/Lottie/HEART PURPLE.json" />
                </div>
            </div>
        </div>
    );
};

export default Advantages;
