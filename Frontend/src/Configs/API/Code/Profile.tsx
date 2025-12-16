const GetProfile = `const loadProfile = (username) => {
  wsClient
    .send({
      type: 'social',
      action: 'get_profile',
      username: username, // Уникальное имя
    })
    .then((res) => {
      const profile = res;

      if (profile.status === 'success') {
        let uid = profile.data.id;
        let targetType = profile.data.type === 'user' ? 0 : 1;
        if (uid) {
          setProfileData(profile.data);
          if (profile.data.posts > 0) {
            // Тут загружаем посты по желанию
            wsClient
              .send({
                type: 'social',
                action: 'load_posts',
                posts_type: 'profile',
                target_id: profile.data.id, // Идентификатор профиля
                target_type: targetType, // Тип профиля 0 - пользователь, 1 - канал
                start_index: 0, // Начальный индекс постов (25, 50, 75 и тд)
              })
              .then((res) => {
                if (res.posts && res.posts.length > 0) {
                  addNewPosts(res.posts);
                  setPostsSI(25);
                }
                setPostsLoaded(true);
              });
          } else {
            setPostsLoaded(true);
          }
        }
      }

      setProfileLoaded(true);
    });
};`;

export default {
    GetProfile
}