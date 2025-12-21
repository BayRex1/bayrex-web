import React from 'react';

interface MobileSidebarMenuProps {
  // добавьте необходимые пропсы
}

const MobileSidebarMenu: React.FC<MobileSidebarMenuProps> = (props) => {
  return (
    <div className="mobile-sidebar-menu">
      <ul>
        <li>Главная</li>
        <li>Мессенджер</li>
        <li>Профиль</li>
        <li>Настройки</li>
      </ul>
    </div>
  );
};

export default MobileSidebarMenu;
