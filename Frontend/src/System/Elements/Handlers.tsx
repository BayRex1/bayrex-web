import { NavLink } from 'react-router-dom';
import { I_SITE, I_GOLD_STAR_GRADIENT } from '../UI/IconPack';
import emojiData from '../../Configs/Emoji.json';
import { NavButton } from '../../Components/Navigate';
import { Avatar } from '../../UIKit';
import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import classNames from 'classnames';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('ru');

const domainEndings = [
  'com', 'ru', 'ua', 'net', 'org', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'xxx', 'co', 'io', 'me', 'group', 'xyz', 'ovh', 'ml', 'onion', 'рф'
];

const ProfileIcons = {
  VERIFY: {
    order: 1,
    icon: <svg key={1} className="Icon" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.808312 2.95062C0.37935 3.6936 0.632055 4.63671 1.13747 6.52292L1.53952 8.0234C2.04493 9.90962 2.29763 10.8527 3.04061 11.2817C3.7836 11.7106 4.7267 11.4579 6.61292 10.9525L8.1134 10.5505C9.99961 10.0451 10.9427 9.79237 11.3717 9.04938C11.8006 8.3064 11.5479 7.36329 11.0425 5.47708L10.7855 4.51772L7.26808 8.03511L6.80991 8.49327C6.60769 8.69548 6.27984 8.69548 6.07763 8.49327L3.6093 6.02494C3.40708 5.82272 3.40708 5.49487 3.6093 5.29266L3.94388 4.95807C4.1461 4.75585 4.47395 4.75585 4.67617 4.95807L6.07764 6.35954C6.27985 6.56175 6.6077 6.56175 6.80992 6.35954L10.3289 2.84056C9.99633 1.69157 9.71499 1.05065 9.13938 0.718315C8.3964 0.289354 7.45329 0.542059 5.56707 1.04747L4.0666 1.44952C2.18038 1.95493 1.23727 2.20764 0.808312 2.95062Z" /><path fillRule="evenodd" clipRule="evenodd" d="M7.35912 9.04248L13.0281 3.37355C13.5336 2.86802 13.5336 2.04838 13.0281 1.54284L12.6935 1.20826C12.1879 0.702721 11.3683 0.702722 10.8628 1.20826L6.44378 5.62725L5.22538 4.40886C4.71984 3.90332 3.90021 3.90332 3.39467 4.40886L3.06008 4.74344C2.55455 5.24898 2.55455 6.06862 3.06008 6.57415L5.52841 9.04248C6.03395 9.54802 6.85358 9.54802 7.35912 9.04248ZM7.62111 7.8733C7.59582 7.81812 7.56315 7.78098 7.54268 7.7605L7.26808 8.03511L6.80991 8.49327C6.60769 8.69548 6.27984 8.69548 6.07763 8.49327L3.6093 6.02494C3.40708 5.82272 3.40708 5.49487 3.6093 5.29266L3.94388 4.95807C4.1461 4.75585 4.47395 4.75585 4.67617 4.95807L6.07764 6.35954C6.27985 6.56175 6.6077 6.56175 6.80992 6.35954L11.412 1.75747C11.6142 1.55525 11.9421 1.55525 12.1443 1.75747L12.4789 2.09206C12.6811 2.29427 12.6811 2.62213 12.4789 2.82434L7.54373 7.75945C7.58805 7.80295 7.62507 7.8619 7.64483 7.94092C7.65289 7.97316 7.65632 8.00398 7.65648 8.03285C7.65606 7.96735 7.6389 7.91213 7.62111 7.8733Z" /></svg>,
    title: 'Это подтверждённый аккаунт'
  },
  GOLD: {
    order: 2,
    icon: <svg key={2} className="Icon" viewBox="0 0 12.7 12.7" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bbb"><stop offset="0" stopColor="#fab31e" /><stop offset="1" stopColor="#ffd479" /></linearGradient><linearGradient id="aaa"><stop offset="0" stopColor="#fab31e" /><stop offset=".744" stopColor="#ffd479" /></linearGradient></defs><path d="M7.296.694C7.106.646 5.043 4.02 4.898 4.078 4.752 4.137.927 3.16.824 3.327.72 3.494 3.29 6.497 3.3 6.65c.01.155-2.105 3.496-1.98 3.645.125.15 3.781-1.37 3.93-1.333.15.037 2.677 3.086 2.857 3.012.18-.073-.135-4.017-.055-4.148.08-.132 3.76-1.593 3.746-1.788-.014-.195-3.86-1.114-3.96-1.233-.1-.119-.353-4.065-.542-4.112z" fill="url(#aaa)" stroke="url(#bbb)" strokeWidth="1.148" strokeLinejoin="round" paintOrder="stroke fill markers" /></svg>,
    title: 'Этот аккаунт имеет активную подписку Gold'
  },
  FAKE: {
    order: 3,
    icon: <img key={3} className="Icon" src="/static_sys/Images/ProfileIcons/Fake.svg" alt="Fake" />,
    title: 'Этот аккаунт пытается выдавать себя за другое лицо, или же распространяет клевету'
  },
  AN: {
    order: 4,
    icon: <img key={4} className="Icon" src="/static_sys/Images/ProfileIcons/AN.png" alt="AltNodes" />,
    title: 'Владелец хостинга "AltNodes"'
  },
  V_MUSIC: {
    order: 5,
    icon: <svg key={5} className="Icon" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M5.89369 0.394989H6.67941V9.03785L6.66934 9.03281C6.676 9.10502 6.6794 9.17818 6.6794 9.25213C6.6794 10.5539 5.62408 11.6093 4.32226 11.6093C3.02045 11.6093 1.96512 10.5539 1.96512 9.25213C1.96512 7.95032 3.02045 6.89499 4.32226 6.89499C4.64233 6.89499 4.94751 6.95878 5.22576 7.07435L5.89369 0.394989ZM9.82227 3.53785H6.67941V0.394989C7.17403 1.87884 8.33841 3.04323 9.82227 3.53785Z" /></svg>,
    title: 'Подтверждённый музыкальный исполнитель'
  }
};

export const HandleUserBlock = ({ user, className }) => {
  return (
    <NavButton to={`/e/${user.username}`} className={classNames('UI-ListElement', className)}>
      <Avatar
        avatar={user.avatar}
        name={user.name}
        size={40}
      />
      <div className="Body">
        <div className="Title">{user.name}</div>
        <div className="Desc">{user.subscribers} подписчиков • {user.posts} постов</div>
      </div>
    </NavButton>
  )
}

export const HandleUserIcons = ({ icons }) => {
  return (
    <div className="UI-UserIcons">
      {icons
        .map(icon => ProfileIcons[icon.icon_id])
        .filter(icon => icon)
        .sort((a, b) => a.order - b.order)
        .map((icon, i) => icon.icon)
      }
    </div>
  )
}

export const HandleLinkIcon = ({ link }) => {
  try {
    let parsedUrl = new URL(link);
    let domain = parsedUrl.hostname;
    let parts = domain.split('.');
    let domainDot = parts[1];
    if (domainDot === 'onion') {
      return <img src="/static_sys/Images/Links/Onion.svg" alt="фыр" />;
    } else {
      switch (domain) {
        case 'elemsocial.com':
          return <img src="/static_sys/Images/Links/Element.svg" alt="фыр" />;
        case '*t.me':
          return <img src="/static_sys/Images/Links/Telegram.svg" alt="фыр" />;
        case 'youtube.com':
        case 'youtu.be':
          return <img src="/static_sys/Images/Links/YouTube.svg" alt="фыр" />;
        case 'tiktok.com':
          return <img src="/static_sys/Images/Links/TikTok.svg" alt="фыр" />;
        case 'steamcommunity.com':
          return <img src="/static_sys/mages/Links/Steam.svg" alt="фыр" />;
        case 'github.com':
          return <img src="/static_sys/Images/Links/GitHub.svg" alt="фыр" />;
        case 'vk.com':
          return <img src="/static_sys/Images/Links/VK.svg" alt="фыр" />;
        case 'open.spotify.com':
          return <img src="/static_sys/Images/Links/Spotify.svg" alt="фыр" />;
        case 'donationalerts.com':
          return <img src="/static_sys/Images/Links/DonationAlerts.svg" alt="фыр" />;
        case 'discord.com':
          return <img src="/static_sys/Images/Links/Discord.svg" alt="фыр" />;
        case 'pinterest.com':
        case 'pin.it':
          return <img src="/static_sys/Images/Links/Pinterest.svg" alt="фыр" />;
        case 'netcore.group':
          return <img src="/static_sys/Images/Links/NetCore.png" alt="фыр" />;
        case 'k-connect.ru':
          return <img src="/static_sys/Images/Links/KConnect.svg" alt="фыр" />;
        default:
          if (domain.includes('t.me')) {
            return <img src="/static_sys/Images/Links/Telegram.svg" alt="Telegram logo" />;
          }
          return <I_SITE />;
      }
    }
  } catch {
    return <I_SITE />;
  }
}

const HandleEmojis = (text: string): (string | React.ReactElement)[] => {
  if (!text) return [text];

  const getEmojiUnifiedCode = (char: string): string => {
    return Array.from(char)
      .map((c) => {
        const codePoint = c.codePointAt(0);
        return codePoint ? codePoint.toString(16).toUpperCase() : '';
      })
      .join('-');
  };

  return Array.from(text).map((char, i) => {
    const unifiedCode = getEmojiUnifiedCode(char);

    let emoji: any = null;
    for (let category of emojiData) {
      for (let subcategory in category) {
        emoji = category[subcategory].find((e: any) => e.unified === unifiedCode);
        if (emoji) break;
      }
      if (emoji) break;
    }

    if (emoji) {
      return (
        <span key={i} className="UI-Emoji">
          <img
            src={`/static_sys/Images/Emoji/Apple/${emoji.unified.toLowerCase()}.png`}
            alt={char}
            draggable={false}
          />
        </span>
      );
    }
    return char;
  });
};

const HandleMarkdown = (content: string): ReactNode[] => {
  if (!content) return [content];
  if (typeof content !== 'string') return [content];

  const currentTheme = localStorage.getItem('S-Theme') || 'LIGHT';
  const isDarkTheme = ['DARK', 'DARK-LG', 'GOLD-DARK', 'AMOLED', 'AMOLED-GOLD', 'AMOLED-LG'].includes(currentTheme);

  const codeBlockRegex = /```(?:(\w+)\n)?([\s\S]*?)```/g;
  const segments: ReactNode[] = [];
  let lastCodeIndex = 0;
  let codeMatch;

  while ((codeMatch = codeBlockRegex.exec(content)) !== null) {
    if (lastCodeIndex < codeMatch.index) {
      segments.push(content.slice(lastCodeIndex, codeMatch.index));
    }

    const [, language, code] = codeMatch;

    segments.push(
      <div
        key={`codeblock-${codeMatch.index}`}
        className="code-block-container"
        data-theme={isDarkTheme ? 'dark' : 'light'}
      >
        {language && <div className="code-language">{language}</div>}
        <Highlight
          theme={isDarkTheme ? themes.vsDark : themes.vsLight}
          code={code.trim()}
          language={language || 'text'}
        >
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre
              className={`code-block language-${language || 'text'}`}
              style={{ padding: language ? '18px 4px 4px 4px' : 4 }}
            >
              <code>
                {tokens.map((line, i) => {
                  const { key, ...lineProps } = getLineProps({ line, key: i });
                  return (
                    <div key={i} {...lineProps}>
                      {line.map((token, tokenKey) => {
                        const { key: tokenKeyProp, ...tokenProps } = getTokenProps({ token, key: tokenKey });
                        return (
                          <span key={tokenKey} {...tokenProps} />
                        );
                      })}
                  </div>
                  );
                })}
              </code>
            </pre>
          )}
        </Highlight>
      </div>
    );

    lastCodeIndex = codeMatch.index + codeMatch[0].length;
  }

  if (lastCodeIndex < content.length) {
    segments.push(content.slice(lastCodeIndex));
  }

  const textSegments = segments.length > 0 ? segments : [content];

  const result: ReactNode[] = [];

  for (const segment of textSegments) {
    if (typeof segment !== 'string') {
      result.push(segment);
      continue;
    }

    const inlineRegex = /(\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|\|\|(.+?)\|\||_(.+?)_|\*([^*]+?)\*|`(.+?)`)/g;
    const inlineResult: ReactNode[] = [];
    let lastInlineIndex = 0;
    let inlineMatch;

    while ((inlineMatch = inlineRegex.exec(segment)) !== null) {
      const [full, , boldAsterisk, boldUnderscore, strike, spoiler, italicUnderscore, italicAsterisk, inlineCode] = inlineMatch;
      const offset = inlineMatch.index;

      if (lastInlineIndex < offset) {
        inlineResult.push(segment.slice(lastInlineIndex, offset));
      }

      if (boldAsterisk || boldUnderscore) {
        inlineResult.push(<strong key={`bold-${offset}`}>{boldAsterisk || boldUnderscore}</strong>);
      } else if (italicUnderscore || italicAsterisk) {
        inlineResult.push(<em key={`italic-${offset}`}>{italicUnderscore || italicAsterisk}</em>);
      } else if (strike) {
        inlineResult.push(<del key={`strike-${offset}`}>{strike}</del>);
      } else if (spoiler) {
        inlineResult.push(<AnimatedSpoiler key={`spoiler-${offset}`} spoiler={spoiler} offset={offset} />);
      } else if (inlineCode) {
        inlineResult.push(
          <code key={`code-${offset}`} className="inline-code">
            {inlineCode}
          </code>
        );
      }

      lastInlineIndex = offset + full.length;
    }

    if (lastInlineIndex < segment.length) {
      inlineResult.push(segment.slice(lastInlineIndex));
    }

    result.push(...inlineResult);
  }

  return result;
};

const HandleFormattedLinks = (content: string): ReactNode[] => {
  if (!content) return [content];
  if (typeof content !== 'string') return [content];

  const regex = /\[(.+?)\]\((.+?)\)/g;
  const result: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const [full, linkText, url] = match;
    const offset = match.index;

    if (lastIndex < offset) {
      result.push(content.slice(lastIndex, offset));
    }

    result.push(
      <a key={`link-${offset}`} href={url} target="_blank" rel="noopener noreferrer">
        {linkText}
      </a>
    );

    lastIndex = offset + full.length;
  }

  if (lastIndex < content.length) {
    result.push(content.slice(lastIndex));
  }

  return result;
};

const HandleUrlsAndMentions = (content: string): ReactNode[] => {
  if (!content) return [content];
  if (typeof content !== 'string') return [content];

  const escapedDomainEndings = domainEndings.map(ending => ending.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const domainRegex = escapedDomainEndings.join('|');
  const urlRegex = new RegExp(`(https?://[^\\s]+|[\\wа-яё-]+\\.(${domainRegex}))(?=[\\s,.!?]|$)`, 'gi');
  const mentionRegex = /(@[\wа-яё]+)(?=[\s,.!?]|$)/gi;

  const segments: ReactNode[] = [content];
  let processedSegments: ReactNode[] = [];

  for (const segment of segments) {
    if (typeof segment !== 'string') {
      processedSegments.push(segment);
      continue;
    }

    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    urlRegex.lastIndex = 0;
    while ((match = urlRegex.exec(segment)) !== null) {
      const [matchedUrl] = match;
      const offset = match.index;

      if (lastIndex < offset) {
        parts.push(segment.slice(lastIndex, offset));
      }

      const href = matchedUrl.startsWith('http') ? matchedUrl : `http://${matchedUrl}`;
      parts.push(
        <a key={`url-${offset}`} href={href} target="_blank" rel="noopener noreferrer">
          {matchedUrl}
        </a>
      );

      lastIndex = offset + matchedUrl.length;
    }

    if (lastIndex < segment.length) {
      parts.push(segment.slice(lastIndex));
    }

    processedSegments.push(...parts);
  }

  segments.length = 0;
  segments.push(...processedSegments);
  processedSegments = [];

  for (const segment of segments) {
    if (typeof segment !== 'string') {
      processedSegments.push(segment);
      continue;
    }

    const parts: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    mentionRegex.lastIndex = 0;
    while ((match = mentionRegex.exec(segment)) !== null) {
      const [matchedMention] = match;
      const offset = match.index;

      if (lastIndex < offset) {
        parts.push(segment.slice(lastIndex, offset));
      }

      const username = matchedMention.substring(1);
      parts.push(
        <NavLink key={`mention-${offset}`} to={`/e/${username}`}>
          {matchedMention}
        </NavLink>
      );

      lastIndex = offset + matchedMention.length;
    }

    if (lastIndex < segment.length) {
      parts.push(segment.slice(lastIndex));
    }

    processedSegments.push(...parts);
  }

  return processedSegments;
};

export const HandleText = ({
  text,
  emojis = true,
  markdown = true,
  links = true,
  urls = true
}: {
  text: string;
  emojis?: boolean;
  markdown?: boolean;
  links?: boolean;
  urls?: boolean;
}) => {
  const parsedNodes = useMemo<React.ReactNode[]>(() => {
    if (!text) return [];
    
    let result: React.ReactNode[] = [text];

    if (links) {
      result = result.flatMap(segment => {
        if (typeof segment !== 'string') return [segment];
        return HandleFormattedLinks(segment);
      });
    }
    if (markdown) {
      result = result.flatMap(segment => {
        if (typeof segment !== 'string') return [segment];
        return HandleMarkdown(segment);
      });
    }
    if (urls) {
      result = result.flatMap(segment => {
        if (typeof segment !== 'string') return [segment];
        return HandleUrlsAndMentions(segment);
      });
    }
    if (emojis) {
      result = result.flatMap(segment => {
        if (typeof segment !== 'string') return [segment];
        return HandleEmojis(segment);
      });
    }
    return result;
  }, [text, emojis, markdown, links, urls]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'S-Theme') {
        UpdateCodeBlocksTheme();
        document.querySelectorAll('.code-block-container').forEach(container => {
          container.setAttribute('data-theme-updated', Date.now().toString());
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (!text) return null;

  return <>{parsedNodes}</>;
};

// Время
export const HandleTimeAge = ({ inputDate, showDetailed = false }) => {
  const getDeclension = (number, forms) => {
    const n = Math.abs(number) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 === 1) return forms[0];
    if (n1 >= 2 && n1 <= 4) return forms[1];
    return forms[2];
  };

  const forms = {
    минута: ['минуту', 'минуты', 'минут'],
    час: ['час', 'часа', 'часов'],
    день: ['день', 'дня', 'дней'],
    неделя: ['неделю', 'недели', 'недель'],
    месяц: ['месяц', 'месяца', 'месяцев'],
    год: ['год', 'года', 'лет']
  };

  const now = dayjs();
  const input = dayjs(inputDate);

  if (now.isBefore(input)) return 'сейчас';

  const seconds = now.diff(input, 'second');
  const minutes = now.diff(input, 'minute');
  const hours = now.diff(input, 'hour');
  const days = now.diff(input, 'day');
  const weeks = now.diff(input, 'week');
  const months = now.diff(input, 'month');
  const years = now.diff(input, 'year');

  if (seconds < 60) return 'сейчас';
  if (minutes < 60) return `${minutes} ${getDeclension(minutes, forms.минута)} назад`;
  if (hours < 24) return `${hours} ${getDeclension(hours, forms.час)} назад`;

  if (!showDetailed) {
    if (days < 7) return `${days} ${getDeclension(days, forms.день)} назад`;
    if (days < 31 && months === 0) return `${weeks} ${getDeclension(weeks, forms.неделя)} назад`;
    if (months < 12) {
      if (months === 0) return `${days} ${getDeclension(days, forms.день)} назад`;
      return `${months} ${getDeclension(months, forms.месяц)} назад`;
    }
    return `${years} ${getDeclension(years, forms.год)} назад`;
  }

  const remainingMonths = months - years * 12;

  if (years > 0 && remainingMonths > 0) {
    return `${years} ${getDeclension(years, forms.год)} и ${remainingMonths} ${getDeclension(remainingMonths, forms.месяц)} назад`;
  }

  if (years > 0) {
    return `${years} ${getDeclension(years, forms.год)} назад`;
  }

  if (months > 0) {
    return `${months} ${getDeclension(months, forms.месяц)} назад`;
  }

  return `${days} ${getDeclension(days, forms.день)} назад`;
};

// Подписчики
export const HandleSubscribers = ({ count }) => {
  if (count < 1) {
    return 'нет подписчиков';
  } else if (count > 4) {
    return count + ' подписчиков'
  } else if (count > 1) {
    return count + ' подписчика'
  } else if (count > 0) {
    return count + ' подписчик'
  }
};

// Размер файла
export const HandleFileSize = ({ bytes }) => {
  const formatBytes = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1048576) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else if (bytes < 1073741824) {
      return `${(bytes / 1048576).toFixed(2)} MB`;
    } else {
      return `${(bytes / 1073741824).toFixed(2)} GB`;
    }
  }
  return (
    formatBytes(bytes)
  )
};

// Посты

export const HandleFileIcon = ({ fileName }) => {
  try {
    const getFileFormat = (fileName) => fileName.split('.').pop().toLowerCase();
    const fileFormat = getFileFormat(fileName);
    switch (fileFormat) {
      case 'svg':
        return (
          <svg viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M2 0C0.895432 0 0 0.895416 0 2V14C0 15.1046 0.895432 16 2 16H10C11.1046 16 12 15.1046 12 14V4L8 0H2ZM8 1.5L10.5 4H9C8.44771 4 8 3.55228 8 3V1.5ZM7 1H2C1.44771 1 1 1.44772 1 2V14C1 14.5523 1.44771 15 2 15H10C10.5523 15 11 14.5523 11 14V5H9C7.89543 5 7 4.10458 7 3V1ZM10 9C10 9.55228 9.55229 10 9 10C8.44771 10 8 9.55228 8 9C8 8.44772 8.44771 8 9 8C9.55229 8 10 8.44772 10 9ZM2 14L4 10L6 12.5L7 11.5L10 14H2Z" /></svg>
        )
      case 'mov':
      case 'mp4':
      case '3gp':
      case 'mkv':
        return (
          <svg viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 10.5C2 10.2239 2.22386 10 2.5 10H6.5C6.77614 10 7 10.2239 7 10.5V11.0667L8.63235 10.1961C8.79888 10.1073 9 10.2279 9 10.4167V13.5833C9 13.7721 8.79888 13.8927 8.63235 13.8039L7 12.9333V13.5C7 13.7761 6.77614 14 6.5 14H2.5C2.22386 14 2 13.7761 2 13.5V10.5Z" /><path fillRule="evenodd" clipRule="evenodd" d="M0 2C0 0.895431 0.895431 0 2 0H8L12 4V14C12 15.1046 11.1046 16 10 16H2C0.895431 16 0 15.1046 0 14V2ZM10.5 4L8 1.5V3C8 3.55228 8.44771 4 9 4H10.5ZM2 1H7V3C7 4.10457 7.89543 5 9 5H11V14C11 14.5523 10.5523 15 10 15H2C1.44772 15 1 14.5523 1 14V2C1 1.44772 1.44772 1 2 1Z" /></svg>
        )
      case 'mp3':
      case 'ogg':
      case 'flac':
      case 'wav':
        return (
          <svg viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7H4.5L4.08803 11.1196C3.90746 11.0426 3.70871 11 3.5 11C2.67157 11 2 11.6716 2 12.5C2 13.3284 2.67157 14 3.5 14C4.32843 14 5 13.3284 5 12.5V9H7C6.05573 8.68524 5.31476 7.94427 5 7Z" /><path fillRule="evenodd" clipRule="evenodd" d="M2 0C0.895432 0 0 0.895416 0 2V14C0 15.1046 0.895432 16 2 16H10C11.1046 16 12 15.1046 12 14V4L8 0H2ZM8 1.5L10.5 4H9C8.44771 4 8 3.55228 8 3V1.5ZM7 1H2C1.44771 1 1 1.44772 1 2V14C1 14.5523 1.44771 15 2 15H10C10.5523 15 11 14.5523 11 14V5H9C7.89543 5 7 4.10458 7 3V1Z" /></svg>
        )
      case 'epack':
        return (
          <svg viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M2 0C0.895432 0 0 0.895416 0 2V14C0 15.1046 0.895432 16 2 16H10C11.1046 16 12 15.1046 12 14V4L8 0H2ZM8 1.5L10.5 4H9C8.44771 4 8 3.55228 8 3V1.5ZM7 1H2C1.44771 1 1 1.44772 1 2V14C1 14.5523 1.44771 15 2 15H10C10.5523 15 11 14.5523 11 14V5H9C7.89543 5 7 4.10458 7 3V1ZM2 10.6883C2 9.75588 2.74619 9 3.66667 9H5.33333C6.25381 9 7 9.75588 7 10.6883V12.3117C7 13.2441 6.25381 14 5.33333 14H3.66667C2.74619 14 2 13.2441 2 12.3117V10.6883ZM3.39486 12.8214C3.23006 12.8214 3.10189 12.6915 3.10189 12.5246C3.10189 12.3597 3.23006 12.2278 3.39486 12.2278C3.55762 12.2278 3.68579 12.3597 3.68579 12.5246C3.68579 12.6915 3.55762 12.8214 3.39486 12.8214ZM5.4904 12.1454H5.96444C5.89933 12.5576 5.52091 12.842 5.01025 12.842C4.36328 12.842 3.97266 12.4112 3.97266 11.7147C3.97266 11.0242 4.36735 10.5688 4.98991 10.5688C5.60229 10.5688 5.98478 10.9995 5.98478 11.6631V11.8301H4.47721V11.861C4.47721 12.2113 4.6888 12.4463 5.02043 12.4463C5.25643 12.4463 5.43547 12.3267 5.4904 12.1454ZM4.99194 10.9665C4.70711 10.9665 4.50163 11.1871 4.48128 11.4921H5.48836C5.47819 11.1829 5.28288 10.9665 4.99194 10.9665Z" /></svg>
        )
      case '7z':
      case 'zip':
      case 'rar':
      case 'gz':
      case 'tar':
        return (
          <svg viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 2C0 0.895431 0.895431 0 2 0H8V1H2C1.44772 1 1 1.44772 1 2V14C1 14.5523 1.44772 15 2 15H10C10.5523 15 11 14.5523 11 14V4H12V14C12 15.1046 11.1046 16 10 16H2C0.895431 16 0 15.1046 0 14V2Z" /><path d="M8 0H7V3C7 4.10457 7.89543 5 9 5H12V4H9C8.44772 4 8 3.55228 8 3V0Z" /><path d="M8 1.5V0L12 4H10.5L8 1.5Z" /><path d="M3 7H4V8H3V7Z" /><path d="M3 9H4V10H3V9Z" /><path d="M3 11H4V12H3V11Z" /><path d="M3 13H4V14H3V13Z" /><path d="M4 6H5V7H4V6Z" /><path d="M4 8H5V9H4V8Z" /><path d="M4 10H5V11H4V10Z" /><path d="M4 12H5V13H4V12Z" /><path d="M4 14H5V15H4V14Z" /><path fillRule="evenodd" clipRule="evenodd" d="M3 1V4.5C3 4.77614 3.22386 5 3.5 5H4.5C4.77614 5 5 4.77614 5 4.5V1H3ZM3.5 3.5V4.5H4.5V3.5H3.5Z" /></svg>
        )
      default:
        return (
          <svg viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 13.5C2 13.2238 2.22386 13 2.5 13H9.5C9.77614 13 10 13.2238 10 13.5C10 13.7762 9.77614 14 9.5 14H2.5C2.22386 14 2 13.7762 2 13.5Z" /><path d="M2.5 11C2.22386 11 2 11.2238 2 11.5C2 11.7762 2.22386 12 2.5 12H5.5C5.77614 12 6 11.7762 6 11.5C6 11.2238 5.77614 11 5.5 11H2.5Z" /><path fillRule="evenodd" clipRule="evenodd" d="M0 2C0 0.895416 0.895432 0 2 0H8L12 4V14C12 15.1046 11.1046 16 10 16H2C0.895432 16 0 15.1046 0 14V2ZM10.5 4L8 1.5V3C8 3.55228 8.44771 4 9 4H10.5ZM2 1H7V3C7 4.10458 7.89543 5 9 5H11V14C11 14.5523 10.5523 15 10 15H2C1.44772 15 1 14.5523 1 14V2C1 1.44772 1.44772 1 2 1Z" /></svg>
        )
    }
  } catch {
    return (
      <svg viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 13.5C2 13.2238 2.22386 13 2.5 13H9.5C9.77614 13 10 13.2238 10 13.5C10 13.7762 9.77614 14 9.5 14H2.5C2.22386 14 2 13.7762 2 13.5Z" /><path d="M2.5 11C2.22386 11 2 11.2238 2 11.5C2 11.7762 2.22386 12 2.5 12H5.5C5.77614 12 6 11.7762 6 11.5C6 11.2238 5.77614 11 5.5 11H2.5Z" /><path fillRule="evenodd" clipRule="evenodd" d="M0 2C0 0.895416 0.895432 0 2 0H8L12 4V14C12 15.1046 11.1046 16 10 16H2C0.895432 16 0 15.1046 0 14V2ZM10.5 4L8 1.5V3C8 3.55228 8.44771 4 9 4H10.5ZM2 1H7V3C7 4.10458 7.89543 5 9 5H11V14C11 14.5523 10.5523 15 10 15H2C1.44772 15 1 14.5523 1 14V2C1 1.44772 1.44772 1 2 1Z" /></svg>
    )
  }
}

export const HandleGoldUser = ({ user }) => {
  return (
    <NavLink
      to={`/e/${user.username}`}
      className="User"
      key={user.name}
    >
      <div className="GoldSub-User">
        <Avatar
          avatar={user.avatar}
          name={user.name}
          size={40}
        />
        <div className="Metadata">
          <div className="Name">{user.name}</div>
          <div className="Posts">
            <HandleSubscribers count={user.subscribers} />
          </div>
        </div>
        <div className="GoldStar">
          <I_GOLD_STAR_GRADIENT startColor={'#fab31e'} stopColor={'#ffd479'} />
        </div>
      </div>
    </NavLink>
  )
}

export const UpdateCodeBlocksTheme = () => {
  const currentTheme = localStorage.getItem('S-Theme') || 'LIGHT';
  const isDarkTheme = ['DARK', 'DARK-LG', 'GOLD-DARK', 'AMOLED', 'AMOLED-GOLD', 'AMOLED-LG'].includes(currentTheme);

  document.querySelectorAll('.code-block-container').forEach(container => {
    container.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  });
};

export const HandleTheme = () => {
  const theme = localStorage.getItem('S-Theme') || 'LIGHT';
  const linkId = 'theme-link';
  let themeLink = document.getElementById(linkId) as HTMLLinkElement;

  if (!themeLink) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = '';
    document.head.appendChild(link);
    themeLink = link;
  }

  switch (theme) {
    case 'LIGHT-LG': themeLink.href = '/static_sys/UI/LiquidGlassStyle.css'; break;
    case 'GOLD': themeLink.href = '/static_sys/UI/GoldStyle.css'; break;
    case 'GOLD-LG': themeLink.href = '/static_sys/UI/LiquidGoldStyle.css'; break;
    case 'DARK': themeLink.href = '/static_sys/UI/DarkStyle.css'; break;
    case 'DARK-LG': themeLink.href = '/static_sys/UI/LiquidGlassDarkStyle.css'; break;
    case 'GOLD-DARK': themeLink.href = '/static_sys/UI/GoldDarkStyle.css'; break;
    case 'GOLD-DARK-LG': themeLink.href = '/static_sys/UI/LiquidGlassDarkGoldStyle.css'; break;
    case 'AMOLED': themeLink.href = '/static_sys/UI/AmoledStyle.css'; break;
    case 'AMOLED-GOLD': themeLink.href = '/static_sys/UI/AmoledGoldStyle.css'; break;
    case 'AMOLED-GOLD-LG': themeLink.href = '/static_sys/UI/LiquidGlassAmoledGoldStyle.css'; break;
    case 'AMOLED-LG': themeLink.href = '/static_sys/UI/LiquidGlassAmoledStyle.css'; break;
    default: themeLink.href = ''; break;
  }

  UpdateCodeBlocksTheme();

  document.querySelectorAll('.code-block-container').forEach(container => {
    container.setAttribute('data-theme-changed', 'true');
  });
};

export const get_PermissionIcon = (Bool) => {
  switch (Bool) {
    case true:
      return (
        <svg className="true" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path d="m256 8c-136.967 0-248 111.033-248 248s111.033 248 248 248 248-111.033 248-248-111.033-248-248-248zm0 48c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m140.204 130.267-22.536-22.718c-4.667-4.705-12.265-4.736-16.97-.068l-141.352 140.216-59.792-60.277c-4.667-4.705-12.265-4.736-16.97-.069l-22.719 22.536c-4.705 4.667-4.736 12.265-.068 16.971l90.781 91.516c4.667 4.705 12.265 4.736 16.97.068l172.589-171.204c4.704-4.668 4.734-12.266.067-16.971z" />
        </svg>
      )
    case false:
      return (
        <svg className="false" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path d="m256 8c-137 0-248 111-248 248s111 248 248 248 248-111 248-248-111-248-248-248zm0 448c-110.5 0-200-89.5-200-200s89.5-200 200-200 200 89.5 200 200-89.5 200-200 200zm101.8-262.2-62.2 62.2 62.2 62.2c4.7 4.7 4.7 12.3 0 17l-22.6 22.6c-4.7 4.7-12.3 4.7-17 0l-62.2-62.2-62.2 62.2c-4.7 4.7-12.3 4.7-17 0l-22.6-22.6c-4.7-4.7-4.7-12.3 0-17l62.2-62.2-62.2-62.2c-4.7-4.7-4.7-12.3 0-17l22.6-22.6c4.7-4.7 12.3-4.7 17 0l62.2 62.2 62.2-62.2c4.7-4.7 12.3-4.7 17 0l22.6 22.6c4.7 4.7 4.7 12.3 0 17z" />
        </svg>
      )
  }
}

const AnimatedSpoiler: React.FC<{spoiler: string, offset: number}> = ({spoiler, offset}) => {
  const spoilerRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const dotsRef = useRef<Array<{x: number, y: number, vx: number, vy: number, opacity: number, size: number}>>([]);

  useEffect(() => {
    const spoilerEl = spoilerRef.current;
    if (!spoilerEl) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.borderRadius = 'inherit';
    
    spoilerEl.appendChild(canvas);

    const updateCanvas = () => {
      const rect = spoilerEl.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(2, 2);
    };

    const initDots = () => {
      dotsRef.current = [];
      const dotsCount = Math.max(50, Math.floor((spoilerEl.offsetWidth * spoilerEl.offsetHeight) / 15));
      
      for (let i = 0; i < dotsCount; i++) {
        dotsRef.current.push({
          x: Math.random() * spoilerEl.offsetWidth,
          y: Math.random() * spoilerEl.offsetHeight,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          opacity: 0.4 + Math.random() * 0.3 ,
          size: 0.5 + Math.random() * 0.8
        });
      }
    };

    const animate = () => {
      if (!ctx || !spoilerEl.offsetWidth) return;
      
      ctx.clearRect(0, 0, spoilerEl.offsetWidth, spoilerEl.offsetHeight);
      
      dotsRef.current.forEach(dot => {
        dot.x += dot.vx;
        dot.y += dot.vy;
        
        if (dot.x < 0 || dot.x > spoilerEl.offsetWidth) dot.vx *= -1;
        if (dot.y < 0 || dot.y > spoilerEl.offsetHeight) dot.vy *= -1;
        
        dot.x = Math.max(0, Math.min(spoilerEl.offsetWidth, dot.x));
        dot.y = Math.max(0, Math.min(spoilerEl.offsetHeight, dot.y));
        
        dot.opacity += (Math.random() - 0.5) * 0.02;
        dot.opacity = Math.max(0.2, Math.min(0.8, dot.opacity));
        
        ctx.fillStyle = `rgba(128, 128, 128, ${dot.opacity})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    updateCanvas();
    initDots();
    animate();

    const resizeObserver = new ResizeObserver(updateCanvas);
    resizeObserver.observe(spoilerEl);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);

  return (
    <span
      ref={spoilerRef}
      key={`spoiler-${offset}`}
      onClick={(e) => {
        e.currentTarget.classList.toggle('spoiler-message__showed');
      }}
      className="spoiler-message spoiler-message-animated"
      data-no-double-tap
      style={{ position: 'relative' }}
    >
      {spoiler}
    </span>
  );
};

