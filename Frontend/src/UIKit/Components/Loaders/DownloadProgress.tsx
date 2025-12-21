const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(1)} ${sizes[i]}`;
};

interface DownloadProgressProps {
  size: number;
  totalBytes: number;
  downloadedBytes: number;
  isDownloading?: boolean;
  isInitialized?: boolean;
  onClick?: () => void;
}

const DownloadProgress = ({
  size,
  totalBytes,
  downloadedBytes,
  isDownloading = false,
  isInitialized = false,
  onClick,
}: DownloadProgressProps) => {
  const percent = Math.min(downloadedBytes / totalBytes, 1);
  const circumference = 2 * Math.PI * 16;
  const strokeDashoffset = circumference * (1 - percent);
  const formattedSize = formatBytes(totalBytes);
  const downloadedSize = formatBytes(downloadedBytes);

  return (
    <div
      className='UI-DownloadProgress'
      onClick={onClick}
    >
      <button
        className='Loader'
        style={{ width: size, height: size }}
      >
        {
          isDownloading && (
            <svg className='Circle' viewBox='0 0 36 36'>
              <circle
                cx='18'
                cy='18'
                r='16'
                fill='none'
                stroke='#ffffff'
                strokeWidth='2'
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap='round'
                transform='rotate(-90 18 18)'
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
            </svg>
          )
        }
        <div
          className='Icon'
          style={{ width: size * 0.6, height: size * 0.6 }}
        >
          {(isInitialized && isDownloading) ? (
            <svg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg'>
              <path d='M195.2 195.2a64 64 0 0 1 90.496 0L512 421.504 738.304 195.2a64 64 0 0 1 90.496 90.496L602.496 512 828.8 738.304a64 64 0 0 1-90.496 90.496L512 602.496 285.696 828.8a64 64 0 0 1-90.496-90.496L421.504 512 195.2 285.696a64 64 0 0 1 0-90.496z' />
            </svg>
          ) : (
            <svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path
                fillRule='evenodd'
                clipRule='evenodd'
                d='M9.163 2.819C9 3.139 9 3.559 9 4.4V11H7.803c-.883 0-1.325 0-1.534.176a.75.75 0 0 0-.266.62c.017.274.322.593.931 1.232l4.198 4.401c.302.318.453.476.63.535a.749.749 0 0 0 .476 0c.177-.059.328-.217.63-.535l4.198-4.4c.61-.64.914-.96.93-1.233a.75.75 0 0 0-.265-.62C17.522 11 17.081 11 16.197 11H15V4.4c0-.84 0-1.26-.164-1.581a1.5 1.5 0 0 0-.655-.656C13.861 2 13.441 2 12.6 2h-1.2c-.84 0-1.26 0-1.581.163a1.5 1.5 0 0 0-.656.656zM5 21a1 1 0 0 0 1 1h12a1 1 0 1 0 0-2H6a1 1 0 0 0-1 1z'
              />
            </svg>
          )}
        </div>
      </button>
      {
        isInitialized && (
          <div className='Progress'>
            <span className='Downloaded'>{downloadedSize}</span>
            <span>{formattedSize}</span>
          </div>
        )
      }
    </div>
  );
};

export default DownloadProgress;
