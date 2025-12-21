import { I_GITHUB } from '../../../System/UI/IconPack';

const GitHubButton = ({ title, link }) => {
  const goToLink = () => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <button onClick={goToLink} className='UI-GitHubButton'>
      <I_GITHUB />
      {title}
    </button>
  );
};

export default GitHubButton;
