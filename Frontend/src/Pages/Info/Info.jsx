import { Navigate, useRoutes } from 'react-router-dom';
import { I_API, I_INFO, I_UPDATE, I_BACK } from '../../System/UI/IconPack';
import Advantages from './Pages/Advantages';
import Rules from './Pages/Rules';
import Updates from './Pages/Updates';
import API from './API';
import { LeftNavButton, TopBar } from '../../Components/Navigate';

const Info = () => {
  const pages = [
    {
      path: 'advantages',
      name: 'Преимущества',
      icon: <I_INFO />,
      element: <Advantages />
    },
    {
      path: 'rules',
      name: 'Правила',
      icon: <I_INFO />,
      element: <Rules />
    },
    {
      path: 'updates',
      name: 'Обновления',
      icon: <I_UPDATE />,
      element: <Updates />
    },
    {
      path: 'api',
      name: 'API',
      icon: <I_API />,
      element: <API />
    },
    {
      path: '/',
      icon: <I_BACK />,
      element: <Navigate to="/" />,
      hidden: true
    },
  ];
  const routing = useRoutes(pages);

  return (
    <>
      <TopBar search={false} title={true} titleText={'Информация'} />
      <div className="Content">
        <div className="UI-L_NAV UI-B_FIRST">
          {
            pages.map((page, i) => {
              return !page?.hidden && (
                <LeftNavButton key={i} currentPage="info" target={page.path}>
                  <div className="UI-LN_ICON">
                    {page.icon}
                  </div>
                  {page.name}
                </LeftNavButton>
              );
            })
          }
        </div>
        <div className="UI-PAGE_BODY">
          <div className="UI-ScrollView">
            {routing}
          </div>
        </div>
      </div>
    </>
  );
};

export default Info;
