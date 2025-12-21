import { NavLink } from 'react-router-dom';
import AuthorsConfig from '../../../Configs/Authors';
import { I_GITHUB, I_LOGO } from '../../../System/UI/IconPack';

const Authors = () => {

    const Social = ({ title, link }) => {
        const platforms = {
            element: {
                name: 'Element',
                icon: <I_LOGO />
            },
            kkonnect: {
                name: 'К-Коннект',
                icon: <img src="/static_sys/Images/Links/KConnect.svg" alt="фыр" />
            },
            tg: {
                name: 'Telegram',
                icon: <img src="/static_sys/Images/Links/Telegram.svg" alt="фыр" />
            },
            github: {
                name: 'GitHub',
                icon: <I_GITHUB />
            }
        };

        return (
            <button
                className="SocialLink"
                onClick={() => window.open(link, '_blank')}
            >
                {platforms[title].icon}
                <div>
                    {platforms[title].name}
                </div>
            </button>
        );
    }

    return AuthorsConfig.map((author, i) => (
        <div
            key={i}
            className="Settings-Author"
        >
            <NavLink to={`/e/${author.username}`}>
                <div className="Avatar" style={{ width: 40, height: 40 }}>
                    <img src={`/static_sys/Images/Authors/${author.avatar}`} alt={author.name} />
                </div>
            </NavLink>
            <div className="Info">
                <NavLink to={`/e/${author.username}`} className="Name">{author.name}</NavLink>
                <div className="JobTitle">{author.bio}</div>
                <div className="Links">
                    {Object.entries(author.social).map(([platform, link]) => (
                        <Social
                            key={platform}
                            title={platform}
                            link={link}
                        />
                    ))}
                </div>
            </div>
        </div>
    ));
};

export default Authors;