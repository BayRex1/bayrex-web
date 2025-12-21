import { useState } from 'react';
import NeoImage from './NeoImage';
import Avatar from './Avatar';
import { NavLink } from 'react-router-dom';

const Gift = ({ gift, payButton = false, onPay, ribbon, ribbonStyle, ribbonText }: any) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    const onLoaded = () => {
        setImageLoaded(true);
    }

    return (
        <div className="UI-Block UI-Gift">
            {
                ribbon && (
                    <div className="Ribbon" style={ribbonStyle}>{ribbonText}</div>
                )
            }
            <div className="Image">
                {
                    !imageLoaded && (
                        <img className="Preview" src={gift.image.preview} alt="фыр" draggable={false} />
                    )
                }
                <NeoImage
                    image={gift.image}
                    onLoaded={onLoaded}
                    gradientBackground={false}
                    draggable={false}
                />
            </div>
            <div className="Metadata">
                <div className="Name">
                    {gift.name}
                </div>
                {
                    gift.description && (
                        <div className="Description">
                            {
                                gift.description
                            }
                        </div>
                    )
                }
            </div>
            {
                gift.sender && (
                    <NavLink to={`/e/${gift.sender.username}`} className="Sender">
                        <div className="From">
                            от
                        </div>
                        <Avatar
                            avatar={gift.sender.avatar}
                            name={gift.sender.name}
                            size={20}
                        />
                        <div className="Name">
                            {gift.sender.name}
                        </div>
                    </NavLink>
                )
            }
            {
                payButton && (
                    <button className="Pay" onClick={onPay}>
                        {gift.price}
                        <div className="UI-Eball">Е</div>
                    </button>
                )
            }
        </div>
    )
}

export default Gift;
