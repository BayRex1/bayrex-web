import Cover from '../Base/Cover';

const CoverInput = ({ cover, onChange, isUploading }) => {
    return (
        <div
            className="UI-CoverInput"
        >
            <Cover
                cover={cover}
                isUploading={isUploading}
            />
            <input
                type="file"
                accept="image/*"
                onChange={onChange}
            />
        </div>
    );
}

export default CoverInput;
