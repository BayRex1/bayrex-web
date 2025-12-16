import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../Context/WebSocket';
import { LineSpinner } from 'ldrs/react'
import 'ldrs/react/LineSpinner.css';

export const Loading = () => {
  const { t } = useTranslation();
  const { wsClient } = useWebSocket();
  const { currentIndex, urls } = wsClient.getConnectionStatus();

  return (
    <div className="UI-Loading">
      <div className="LoadingContent">
        <div className="UI-Block Servers">
          {urls.map((url, i) => (
            <div
              className="Server"
              key={url}
              style={{ fontWeight: i === currentIndex ? 'bold' : 'normal' }}
            >
              {url}
              {i === currentIndex && (
                <LineSpinner
                  size="25"
                  stroke="2"
                  speed="1"
                  color="var(--TEXT_COLOR)"
                />
              )}
            </div>
          ))}
        </div>
        <div className="Text">{t('vpn_or_tor')}</div>
      </div>
    </div>
  )
}