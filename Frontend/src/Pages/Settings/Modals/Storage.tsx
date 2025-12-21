import { useEffect, useState, memo, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useModalsStore } from '../../../Store/modalsStore';
import { useDatabase } from '../../../System/Context/Database';
import {
  I_AVATAR,
  I_MESSENGER,
  I_COVER,
  I_MUSIC,
  I_PHOTO,
  I_COMMENT,
} from '../../../System/UI/IconPack';
import { Button, FormButton } from '../../../UIKit';
import '../../../System/UI/Storage.scss';

const icons = [
  { icon: I_AVATAR, color: '#ffab49' },
  { icon: I_MESSENGER, color: '#7b6bff' },
  { icon: I_COVER, color: '#4baf78' },
  { icon: I_MUSIC, color: '#ff5b49' },
  { icon: I_PHOTO, color: '#5b8af7' },
  { icon: I_COMMENT, color: '#f75bcf' },
];

const CategoryIcon = ({ category }) => {
  const iconMap = {
    avatars: I_AVATAR,
    messenger: I_MESSENGER,
    covers: I_COVER,
    music: I_MUSIC,
    posts: I_PHOTO,
    comments: I_COMMENT,
  };

  const colorMap = {
    avatars: '#ffab49',
    messenger: '#7b6bff',
    covers: '#4baf78',
    music: '#ff5b49',
    posts: '#5b8af7',
    comments: '#f75bcf',
  };

  const IconComponent = iconMap[category];
  const iconColor = colorMap[category];

  if (!IconComponent) return null;

  return (
    <div
      className='Storage-Category-Icon'
      style={{ backgroundColor: iconColor }}
    >
      <IconComponent />
    </div>
  );
};

const CircleCheckbox = ({ selected, color, onClick }) => {
  return (
    <div className='Storage-Category-Checkbox' onClick={onClick}>
      <div
        className='Storage-Checkbox'
        style={{
          borderColor: selected ? color : 'var(--TEXT_COLOR_LITE)',
          backgroundColor: selected ? color : 'transparent',
        }}
      >
        {selected && (
          <svg width='12' height='12' viewBox='0 0 12 12' fill='none'>
            <path
              d='M2 6L5 9L10 3'
              stroke='white'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        )}
      </div>
    </div>
  );
};

const AnimatedSuccessScreen = memo(({ isVisible, onComplete }) => {
  const [particles, setParticles] = useState([]);
  const [debris, setDebris] = useState([]);

  const generateParticles = useCallback(() => {
    const newParticles = [];
    for (let i = 0; i < 12; i++) {
      const iconData = icons[Math.floor(Math.random() * icons.length)];
      const angle = (i / 12) * 2 * Math.PI;
      const orbitRadius = 55;

      newParticles.push({
        id: i,
        icon: iconData.icon,
        color: iconData.color,
        angle: angle,
        orbitRadius: orbitRadius,
        scale: 0.7 + Math.random() * 0.2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
      });
    }
    return newParticles;
  }, []);

  const generateDebris = useCallback(() => {
    const newDebris = [];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const speed = 40 + Math.random() * 80;
      const isLarge = Math.random() > 0.7;

      newDebris.push({
        id: i,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        size: isLarge ? 4 + Math.random() * 3 : 2 + Math.random() * 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 25,
        isLarge: isLarge,
      });
    }
    return newDebris;
  }, []);

  useEffect(() => {
    if (isVisible) {
      setParticles(generateParticles());

      const debrisTimer = setTimeout(() => {
        setDebris(generateDebris());
      }, 4200);

      const completeTimer = setTimeout(() => {
        onComplete();
      }, 7500);

      return () => {
        clearTimeout(debrisTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, onComplete, generateParticles, generateDebris]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'backOut' }}
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4CAF50, #45a049)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 16px rgba(76, 175, 80, 0.3)',
          zIndex: 10,
          position: 'absolute',
        }}
      />

      {particles.map((particle) => {
        const IconComponent = particle?.icon;
        if (!IconComponent) return null;

        return (
          <motion.div
            key={particle.id}
            style={{
              position: 'absolute',
              width: '28px',
              height: '28px',
              borderRadius: '9px',
              backgroundColor: particle.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px ${particle.color}50`,
              left: '50%',
              top: '50%',
              marginLeft: '-14px',
              marginTop: '-14px',
              zIndex: 5,
            }}
            initial={{
              x: Math.cos(particle.angle) * particle.orbitRadius,
              y: Math.sin(particle.angle) * particle.orbitRadius,
              scale: 0,
              opacity: 0,
              rotate: particle.rotation,
            }}
            animate={{
              x: [
                Math.cos(particle.angle) * particle.orbitRadius,
                Math.cos(particle.angle + Math.PI * 2) * particle.orbitRadius,
                Math.cos(particle.angle + Math.PI * 2.3) *
                (particle.orbitRadius * 0.4),
                0,
              ],
              y: [
                Math.sin(particle.angle) * particle.orbitRadius,
                Math.sin(particle.angle + Math.PI * 2) * particle.orbitRadius,
                Math.sin(particle.angle + Math.PI * 2.3) *
                (particle.orbitRadius * 0.4),
                0,
              ],
              scale: [0, particle.scale, particle.scale, particle.scale],
              opacity: [0, 1, 1, 1],
              rotate: particle.rotation + particle.rotationSpeed * 360,
            }}
            transition={{
              delay: 1.0,
              duration: 3.2,
              times: [0, 0.65, 0.9, 1],
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            <IconComponent
              style={{
                width: '18px',
                height: '18px',
                fill: 'white',
                color: 'white',
                opacity: 1,
              }}
            />
          </motion.div>
        );
      })}

      {debris.map((piece) => (
        <motion.div
          key={`debris-${piece.id}`}
          style={{
            position: 'absolute',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: 'white',
            borderRadius: piece.isLarge ? '2px' : '50%',
            zIndex: 4,
            left: '50%',
            top: '50%',
            boxShadow: piece.isLarge
              ? '0 2px 4px rgba(255,255,255,0.3)'
              : 'none',
          }}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: 0,
            rotate: piece.rotation,
          }}
          animate={{
            x: piece.velocityX,
            y: piece.velocityY,
            scale: [0, 1.3, 0.8, 0],
            opacity: [0, 1, 0.8, 0],
            rotate: piece.rotation + piece.rotationSpeed * 360,
          }}
          transition={{
            duration: 2.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}

      <motion.svg
        width='50'
        height='50'
        viewBox='0 0 24 24'
        fill='none'
        initial={{ pathLength: 0, opacity: 0, scale: 0 }}
        animate={{ pathLength: 1, opacity: 1, scale: 1 }}
        transition={{ delay: 6.0, duration: 1.2, ease: 'easeInOut' }}
        style={{
          zIndex: 20,
          position: 'absolute',
        }}
      >
        <motion.path
          d='M7 12L11 16L17 8'
          stroke='white'
          strokeWidth='4'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </motion.svg>
    </div>
  );
});

const Storage = memo(() => {
  const { t } = useTranslation();
  const { openModal } = useModalsStore() as any;
  const db = useDatabase();

  const [storageInfo, setStorageInfo] = useState({
    total: 0,
    categories: [
      {
        id: 'avatars',
        name: t('category_avatars'),
        size: 0,
        color: '#ffab49',
        percent: 0,
        selected: true,
      },
      {
        id: 'messenger',
        name: t('category_messenger'),
        size: 0,
        color: '#7b6bff',
        percent: 0,
        selected: true,
      },
      {
        id: 'covers',
        name: t('category_covers'),
        size: 0,
        color: '#4baf78',
        percent: 0,
        selected: true,
      },
      {
        id: 'music',
        name: t('category_music'),
        size: 0,
        color: '#ff5b49',
        percent: 0,
        selected: true,
      },
      {
        id: 'posts',
        name: t('category_posts'),
        size: 0,
        color: '#5b8af7',
        percent: 0,
        selected: true,
      },
      {
        id: 'comments',
        name: t('category_comments'),
        size: 0,
        color: '#f75bcf',
        percent: 0,
        selected: true,
      },
    ],
  });

  const [selectedCount, setSelectedCount] = useState(6);
  const [isClearing, setIsClearing] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const calculateStorageSize = useCallback(async () => {
    try {
      const images = await db.image_cache.toArray();

      let messengerSize = 0;
      let avatarsSize = 0;
      let coversSize = 0;
      let musicSize = 0;
      let postsSize = 0;
      let commentsSize = 0;

      images.forEach((img) => {
        let itemSize = 0;

        if (img.file_blob) itemSize += img.file_blob.size;
        if (img.simple_blob) itemSize += img.simple_blob.size;

        if (img.hasOwnProperty('blob') && img.blob instanceof Blob) {
          itemSize += img.blob.size;
        }

        const pathString = Array.isArray(img.path)
          ? img.path.join('/')
          : img.path;

        if (pathString && pathString.includes('avatars')) {
          avatarsSize += itemSize;
        } else if (
          pathString &&
          (pathString.includes('downloads') || pathString.includes('files'))
        ) {
          messengerSize += itemSize;
        } else if (
          pathString &&
          (pathString.includes('covers') || pathString.includes('music/covers'))
        ) {
          coversSize += itemSize;
        } else if (
          pathString &&
          (pathString.includes('posts/images') ||
            pathString.includes('posts/videos'))
        ) {
          postsSize += itemSize;
        } else if (pathString && pathString.includes('comments/images')) {
          commentsSize += itemSize;
        } else {
          if (itemSize > 0) {
            messengerSize += itemSize;
          }
        }
      });

      try {
        const filesCacheItems = await db.files_cache.toArray();

        for (const item of filesCacheItems) {
          if (item && item.file_blob) {
            postsSize += item.file_blob.size;
          }
        }
      } catch (error) { }

      try {
        const fileChunks = await db.files_chunks.toArray();

        for (const chunk of fileChunks) {
          if (chunk && chunk.value && chunk.value instanceof Blob) {
            postsSize += chunk.value.size;
          } else if (
            chunk &&
            chunk.value &&
            typeof chunk.value === 'object' &&
            chunk.value.byteLength
          ) {
            postsSize += chunk.value.byteLength;
          }
        }
      } catch (error) { }

      try {
        const musicItems = await db.music_cache.toArray();

        for (const item of musicItems) {
          if (item && item.file_blob) {
            musicSize += item.file_blob.size;
          }
        }
      } catch (error) { }

      if (avatarsSize > 0 && avatarsSize < 1024) avatarsSize = 1024;
      if (messengerSize > 0 && messengerSize < 1024) messengerSize = 1024;
      if (coversSize > 0 && coversSize < 1024) coversSize = 1024;
      if (musicSize > 0 && musicSize < 1024) musicSize = 1024;
      if (postsSize > 0 && postsSize < 1024) postsSize = 1024;
      if (commentsSize > 0 && commentsSize < 1024) commentsSize = 1024;

      const totalSize =
        messengerSize +
        avatarsSize +
        coversSize +
        musicSize +
        postsSize +
        commentsSize;

      localStorage.setItem('lastCacheSize', totalSize.toString());

      setStorageInfo({
        total: totalSize,
        categories: [
          {
            id: 'avatars',
            name: t('category_avatars'),
            size: avatarsSize,
            color: '#ffab49',
            percent:
              totalSize > 0
                ? Math.max(1, Math.round((avatarsSize / totalSize) * 100))
                : 0,
            selected: true,
          },
          {
            id: 'covers',
            name: t('category_covers'),
            size: coversSize,
            color: '#4baf78',
            percent:
              totalSize > 0
                ? Math.max(1, Math.round((coversSize / totalSize) * 100))
                : 0,
            selected: true,
          },
          {
            id: 'posts',
            name: t('category_posts'),
            size: postsSize,
            color: '#5b8af7',
            percent:
              totalSize > 0
                ? Math.max(1, Math.round((postsSize / totalSize) * 100))
                : 0,
            selected: true,
          },
          {
            id: 'comments',
            name: t('category_comments'),
            size: commentsSize,
            color: '#f75bcf',
            percent:
              totalSize > 0
                ? Math.max(1, Math.round((commentsSize / totalSize) * 100))
                : 0,
            selected: true,
          },
          {
            id: 'music',
            name: t('category_music'),
            size: musicSize,
            color: '#ff5b49',
            percent:
              totalSize > 0
                ? Math.max(1, Math.round((musicSize / totalSize) * 100))
                : 0,
            selected: true,
          },
          {
            id: 'messenger',
            name: t('category_messenger'),
            size: messengerSize,
            color: '#7b6bff',
            percent:
              totalSize > 0
                ? Math.max(1, Math.round((messengerSize / totalSize) * 100))
                : 0,
            selected: true,
          },
        ],
      });
    } catch (error) { }
  }, [db, t]);

  useEffect(() => {
    calculateStorageSize();
  }, [refresh, calculateStorageSize]);

  useEffect(() => {
    const selectedCount = storageInfo.categories.filter(
      (cat) => cat.selected
    ).length;
    setSelectedCount(selectedCount);
  }, [storageInfo.categories]);

  useEffect(() => {
    setStorageInfo((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) => ({
        ...cat,
        name:
          cat.id === 'music'
            ? t('category_music')
            : cat.id === 'posts'
              ? t('category_posts')
              : cat.id === 'comments'
                ? t('category_comments')
                : cat.name,
      })),
    }));
  }, [t]);

  const formatSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Б';

    const sizes = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));

    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
  }, []);

  const toggleCategorySelection = useCallback((categoryId) => {
    setStorageInfo((prev) => {
      const targetCategory = prev.categories.find(
        (cat) => cat.id === categoryId
      );
      if (targetCategory && targetCategory.selected) {
        const selectedCount = prev.categories.filter(
          (cat) => cat.selected
        ).length;
        if (selectedCount === 1) {
          return prev;
        }
      }

      return {
        ...prev,
        categories: prev.categories.map((cat) =>
          cat.id === categoryId ? { ...cat, selected: !cat.selected } : cat
        ),
      };
    });
  }, []);

  const clearCategoryByPath = useCallback(
    async (path) => {
      try {
        const itemsToDelete = await db.image_cache
          .where('path')
          .startsWith(path)
          .toArray();

        if (itemsToDelete.length > 0) {
          for (const item of itemsToDelete) {
            try {
              if (item.file_blob instanceof Blob) {
              }

              if (item.simple_blob instanceof Blob) {
              }

              await db.image_cache
                .where('[path+file]')
                .equals([item.path, item.file])
                .delete();
            } catch (e) { }
          }

          return itemsToDelete.length;
        } else {
          return 0;
        }
      } catch (error) {
        return 0;
      }
    },
    [db]
  );

  const clearDownloadsStorage = useCallback(async () => {
    try {
      let deletedCount = 0;

      try {
        const countBefore = await db.downloads.count();

        await db.downloads.clear();

        deletedCount = countBefore;
      } catch (e) { }

      return deletedCount;
    } catch (error) {
      return 0;
    }
  }, [db]);

  const clearFilesStorage = useCallback(async () => {
    try {
      let deletedCount = 0;

      try {
        const countBefore = await db.files.count();

        await db.files.clear();

        deletedCount = countBefore;
      } catch (e) { }

      return deletedCount;
    } catch (error) {
      return 0;
    }
  }, [db]);

  const clearMusicStorage = useCallback(async () => {
    try {
      let deletedCount = 0;

      try {
        const countBefore = await db.music_cache.count();
        await db.music_cache.clear();
        deletedCount = countBefore;
      } catch (e) { }

      return deletedCount;
    } catch (error) {
      return 0;
    }
  }, [db]);

  const clearMessengerData = useCallback(async () => {
    try {
      let totalCleared = 0;

      const messengerCleared = await clearCategoryByPath('messenger');
      totalCleared += messengerCleared;

      const downloadsCleared = await clearDownloadsStorage();
      totalCleared += downloadsCleared;

      const filesCleared = await clearFilesStorage();
      totalCleared += filesCleared;

      const musicCleared = await clearMusicStorage();
      totalCleared += musicCleared;

      return totalCleared;
    } catch (error) {
      return 0;
    }
  }, [
    clearCategoryByPath,
    clearDownloadsStorage,
    clearFilesStorage,
    clearMusicStorage,
  ]);

  const clearCategory = useCallback(
    async (category) => {
      try {
        setIsClearing(true);
        let totalCleared = 0;

        if (category.id === 'all') {
          const selectedCategories = storageInfo.categories.filter(
            (c) => c.selected
          );

          for (const category of selectedCategories) {
            if (category.id === 'messenger') {
              const cleared = await clearMessengerData();
              totalCleared += cleared;
            } else if (category.id === 'avatars') {
              const cleared = await clearCategoryByPath('avatars');
              totalCleared += cleared;
            } else if (category.id === 'covers') {
              const clearedCovers = await clearCategoryByPath('covers');
              const clearedMusicCovers = await clearCategoryByPath(
                'music/covers'
              );
              totalCleared += clearedCovers + clearedMusicCovers;
            } else if (category.id === 'music') {
              const cleared = await clearMusicStorage();
              totalCleared += cleared;
            } else if (category.id === 'posts') {
              const clearedImages = await clearCategoryByPath('posts/images');
              const clearedVideos = await clearCategoryByPath('posts/videos');

              try {
                await db.files_cache.clear();
                await db.files_chunks.clear();
              } catch (error) { }

              totalCleared += clearedImages + clearedVideos;
            } else if (category.id === 'comments') {
              const cleared = await clearCategoryByPath('comments/images');
              totalCleared += cleared;
            }
          }
        } else {
          if (category.id === 'messenger') {
            totalCleared = await clearMessengerData();
          } else if (category.id === 'avatars') {
            totalCleared = await clearCategoryByPath('avatars');
          } else if (category.id === 'covers') {
            const clearedCovers = await clearCategoryByPath('covers');
            const clearedMusicCovers = await clearCategoryByPath(
              'music/covers'
            );
            totalCleared = clearedCovers + clearedMusicCovers;
          } else if (category.id === 'music') {
            totalCleared = await clearMusicStorage();
          } else if (category.id === 'posts') {
            const clearedImages = await clearCategoryByPath('posts/images');
            const clearedVideos = await clearCategoryByPath('posts/videos');

            try {
              await db.files_cache.clear();
              await db.files_chunks.clear();
            } catch (error) { }

            totalCleared = clearedImages + clearedVideos;
          } else if (category.id === 'comments') {
            totalCleared = await clearCategoryByPath('comments/images');
          }
        }

        if ('performance' in window) {
          performance.clearResourceTimings();
        }

        setTimeout(async () => {
          await calculateStorageSize();
          setRefresh((prev) => prev + 1);

          setTimeout(async () => {
            await calculateStorageSize();
            setRefresh((prev) => prev + 2);
            setIsClearing(false);
            setShowSuccessAnimation(true);
          }, 500);
        }, 300);
      } catch (error) {
        setIsClearing(false);
      }
    },
    [
      storageInfo.categories,
      clearMessengerData,
      clearCategoryByPath,
      clearMusicStorage,
      calculateStorageSize,
      openModal,
      t,
      db,
    ]
  );

  const handleClearSelected = useCallback(() => {
    const selectedCategories = storageInfo.categories.filter((c) => c.selected);

    if (selectedCategories.length === 0) return;

    const categoryNames = selectedCategories.map((c) => c.name).join(', ');

    openModal({
      type: 'query',
      props: {
        title: t('are_you_sure'),
        message: `${t('clear_selected_confirmation')} ${categoryNames}?`,
        onConfirm: async () => {
          await clearCategory({ id: 'all' });
        },
      },
    });
  }, [storageInfo.categories, openModal, t, clearCategory]);

  const handleClearAll = useCallback(() => {
    openModal({
      type: 'query',
      props: {
        title: t('are_you_sure'),
        message: t('clear_all_data_confirmation'),
        onConfirm: async () => {
          setStorageInfo((prev) => ({
            ...prev,
            categories: prev.categories.map((cat) => ({
              ...cat,
              selected: true,
            })),
          }));

          setTimeout(async () => {
            await clearCategory({ id: 'all' });
          }, 100);
        },
      },
    });
  }, [openModal, t, clearCategory]);

  const selectedSize = useMemo(
    () =>
      storageInfo.categories
        .filter((cat) => cat.selected)
        .reduce((total, cat) => total + cat.size, 0),
    [storageInfo.categories]
  );

  const formattedTotalSize = useMemo(
    () => formatSize(storageInfo.total),
    [storageInfo.total, formatSize]
  );

  const selectedCategoriesText = useCallback(() => {
    const selectedCategories = storageInfo.categories.filter((c) => c.selected);
    if (selectedCategories.length === 0) {
      return t('clear');
    } else if (selectedCategories.length === storageInfo.categories.length) {
      return t('clear_storage');
    } else {
      const categoryNames = selectedCategories.map((c) => c.name);
      if (categoryNames.length <= 2) {
        return `${t('clear')}: ${categoryNames.join(', ')}`;
      } else {
        return `${t('clear')}: ${categoryNames.length} ${t('categories')}`;
      }
    }
  }, [storageInfo.categories, t]);

  const chartCategories = useMemo(() => {
    return storageInfo.categories.filter((cat) => cat.selected && cat.size > 0);
  }, [storageInfo.categories]);

  const renderChartSegments = useCallback(() => {
    if (chartCategories.length === 0) {
      return (
        <circle
          cx='50'
          cy='50'
          r='40'
          fill='none'
          stroke='#333'
          strokeWidth='1'
          strokeDasharray='5,5'
          opacity='0.3'
        />
      );
    }

    return chartCategories.map((category, index, filteredCategories) => {
      if (filteredCategories.length === 1) {
        return (
          <circle
            key={category.id}
            cx='50'
            cy='50'
            r='40'
            fill={category.color}
            stroke='var(--BODY_COLOR)'
            strokeWidth='0.7'
            className='Storage-Chart-Segment'
            style={{ animationDelay: '0s' }}
          />
        );
      }

      const totalSelected = filteredCategories.reduce(
        (acc, cat) => acc + cat.size,
        0
      );

      const minPercent = 5;

      let categoryPercent =
        totalSelected > 0 ? (category.size / totalSelected) * 100 : 0;
      if (category.size > 0 && categoryPercent < minPercent) {
        categoryPercent = minPercent;
      }

      const totalAdjustedPercent = filteredCategories.reduce((acc, cat) => {
        const catPercent =
          totalSelected > 0 ? (cat.size / totalSelected) * 100 : 0;
        return (
          acc +
          (cat.size > 0 && catPercent < minPercent ? minPercent : catPercent)
        );
      }, 0);

      if (totalAdjustedPercent > 100) {
        categoryPercent = (categoryPercent / totalAdjustedPercent) * 100;
      }

      const startPercent = filteredCategories
        .slice(0, index)
        .reduce((acc, cat) => {
          const catPercent =
            totalSelected > 0 ? (cat.size / totalSelected) * 100 : 0;
          const adjustedPercent =
            cat.size > 0 && catPercent < minPercent ? minPercent : catPercent;
          return (
            acc +
            (totalAdjustedPercent > 100
              ? (adjustedPercent / totalAdjustedPercent) * 100
              : adjustedPercent)
          );
        }, 0);

      const startAngle = (startPercent / 100) * 360 - 90;
      const endAngle = ((startPercent + categoryPercent) / 100) * 360 - 90;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = 50 + 40 * Math.cos(startRad);
      const y1 = 50 + 40 * Math.sin(startRad);
      const x2 = 50 + 40 * Math.cos(endRad);
      const y2 = 50 + 40 * Math.sin(endRad);

      const largeArcFlag = categoryPercent > 50 ? 1 : 0;

      const path = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      return (
        <path
          key={category.id}
          d={path}
          fill={category.color}
          className='Storage-Chart-Segment'
          style={{
            animationDelay: `${index * 0.1}s`,
          }}
        />
      );
    });
  }, [chartCategories]);

  const renderCategories = useCallback(() => {
    return storageInfo.categories.map((category) => (
      <button
        key={category.id}
        className=' UI-Block Storage-Category'
        onClick={() => toggleCategorySelection(category.id)}
      >
        <CategoryIcon category={category.id} />
        <div className='Storage-Category-Info'>
          <div className='Storage-Category-Name'>{category.name}</div>
          <div className='Storage-Category-Size'>
            {formatSize(category.size)}
          </div>
        </div>
        <CircleCheckbox
          selected={category.selected}
          color={category.color}
          onClick={(e) => {
            e.stopPropagation();
            toggleCategorySelection(category.id);
          }}
        />
      </button>
    ));
  }, [storageInfo.categories, toggleCategorySelection, formatSize]);

  return (
    <div className='Storage-Container'>
      <div className='Storage-Chart-Section'>
        <div className='Storage-Chart'>
          {showSuccessAnimation ? (
            <>
              <AnimatedSuccessScreen
                isVisible={showSuccessAnimation}
                onComplete={() => setShowSuccessAnimation(false)}
              />
            </>
          ) : (
            <>
              <svg viewBox='0 0 100 100' className='Storage-ChartSVG'>
                {renderChartSegments()}
                <circle cx='50' cy='50' r='30' fill='var(--BODY_COLOR)' />
              </svg>

              <div className='Storage-ChartTotalSize'>
                {formatSize(selectedSize)}
              </div>
            </>
          )}
        </div>

        <div className='Storage-Title'>{t('storage_usage')}</div>
        <div className='Storage-Subtitle'>
          {t('storage_info', { size: formattedTotalSize })}
        </div>
      </div>

      <div className='CategoriesContainer' style={{ marginBottom: 50 }}>
        <div className='UI-PartitionName'>{t('storage_selection_hint')}</div>

        <div style={{ gap: 5 }}>{renderCategories()}</div>
        <div className='Storage-Note'>{t('storage_cloud_note')}</div>
      </div>

      <div className='Footer'>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <Button
            onClick={handleClearSelected}
            title={isClearing ? t('clearing') : selectedCategoriesText()}
            buttonStyle='action'
          />
          <Button
            onClick={handleClearAll}
            title={isClearing ? t('clearing') : t('clear_all_cache')}
          />
        </div>
      </div>
    </div>
  );
});

export default Storage;
