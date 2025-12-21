import '/src/System/UI/Style.scss';
import '/src/System/UI/LoadersPack.css';
import '/src/System/UI/AnimPack.css';
import '/src/System/Modules/i18n';
import 'ldrs/react/Ring.css'
import { useEffect, useState } from 'react';
import { useRoutes, Navigate, Outlet } from 'react-router';
import { HandleTheme } from '/src/System/Elements/Handlers';
import { Loading } from '/src/System/Elements/Loading';
import { useWebSocket } from '/src/System/Context/WebSocket';
import { useAuth } from '/src/System/Hooks/useAuth';
import MainLayout from '/src/Layouts/MainLayout';
import Authorization from '/src/Pages/Authorization';
import Profile from '/src/Pages/Profile';
import Post from '/src/Pages/Post';
import Home from '/src/Pages/Home';
import Music from '/src/Pages/Music';
import Messenger from '/src/Pages/Messenger';
import Settings from '/src/Pages/Settings';
import ViewEPACK from '/src/Pages/ViewEPACK';
import Apps from '/src/Pages/Apps';
import Gold from '/src/Pages/Gold/Gold';
import Balance from '/src/Pages/Balance';
import Panel from '/src/Pages/Panel';
import Info from '/src/Pages/Info/Info';
import ConnectApp from '/src/Pages/Apps/ConnectApp';
import JoinGroup from '/src/Pages/Messenger/JoinGroup';
import Hall from '/src/Pages/Hall';
import Notifications from '/src/Pages/Notifications';

HandleTheme();

const ProtectedRoute = () => {
  const { accountData } = useAuth();

  return (
    accountData ? <Outlet /> : <Navigate to="/auth" replace />
  )
};

const routes = [
  {
    path: '/auth',
    element: <Authorization />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: (
          <MainLayout className="HomePage">
            <Home />
          </MainLayout>
        ),
      },
      {
        path: '/home',
        element: (
          <MainLayout className="HomePage">
            <Home />
          </MainLayout>
        ),
      },
      {
        path: '/notifications',
        element: (
          <MainLayout className="Notifications-Page">
            <Notifications />
          </MainLayout>
        ),
      },
      {
        path: '/panel/*',
        name: 'Панель управления',
        element: <Panel />,
        layout: 'base'
      },
      {
        path: '/chat',
        element: <Messenger />,
      },
      {
        path: '/chat/:selectedChat',
        element: <Messenger />,
      },
      {
        path: '/music/*',
        element: (
          <MainLayout className="Music-Page">
            <Music />
          </MainLayout>
        ),
      },
      {
        path: '/settings',
        element: (
          <MainLayout className="Settings-Page">
            <Settings />
          </MainLayout>
        ),
      },
      {
        path: '/apps',
        element: (
          <MainLayout className="Apps-Page">
            <Apps />
          </MainLayout>
        ),
      },
      {
        path: '/gold',
        element: (
          <MainLayout className="GoldSub-Page">
            <Gold />
          </MainLayout>
        ),
      },
      {
        path: '/wallet',
        element: (
          <MainLayout className="BalancePage">
            <Balance />
          </MainLayout>
        ),
      },
      {
        path: 'hall',
        element: (
          <MainLayout className="Hall-Page">
            <Hall />
          </MainLayout>
        ),
      },
      {
        path: '/connect_app/:app_id',
        element: (
          <ConnectApp />
        )
      },
      {
        path: '/join/:link',
        element: (
          <JoinGroup />
        )
      }
    ]
  },
  {
    path: '/profile/:username/*',
    protected: false,
    element: <Profile />,
  },
  {
    path: '/e/:username/*',
    protected: false,
    element: <Profile />,
  },
  {
    path: '/post/:id',
    protected: false,
    element: <Post />,
  },
  {
    path: '/epack',
    element: (
      <MainLayout className="EPACK-Page">
        <ViewEPACK />
      </MainLayout>
    ),
  },
  {
    path: '/info',
    protected: false,
    name: 'Информация',
    children: [
      {
        path: '*',
        element: <Info />,
      },
    ],
  },
];

export const App = () => {
  const { socketReady } = useWebSocket();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded && socketReady) {
      setIsLoaded(true);
    }
  }, [socketReady, isLoaded]);

  const routing = useRoutes(routes);
  return (
    <>
      {isLoaded ? routing : <Loading />}
      {/* Liquid ass */}
      <svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise"></feTurbulence>
            <feGaussianBlur in="noise" stdDeviation="2" result="blurred"></feGaussianBlur>
            <feDisplacementMap in="SourceGraphic" in2="blurred" scale="77" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>
          </filter>
        </defs>
      </svg>
    </>
  );
};
