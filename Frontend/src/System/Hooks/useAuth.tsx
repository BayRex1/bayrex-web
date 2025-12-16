import { useSelector, useDispatch } from 'react-redux';
import { deleteAccount, setAccountData, setAuthorized, setSocketAuthorized, switchAccount, updateOrCreateAccount } from '../../Store/Slices/auth';

export const useAuth = () => {
    const dispatch = useDispatch();

    const isAuthorized = useSelector((state: any) => state.auth.isAuthorized);
    const isSocketAuthorized = useSelector((state: any) => state.auth.isSocketAuthorized);
    const accountData = useSelector((state: any) => state.auth.accountData);
    const accounts = useSelector((state: any) => state.auth.accounts);

    const socketAuthorize = (val) => {
        dispatch(setSocketAuthorized(val));
    }
    const switchUserAccount = (id: number) => dispatch(switchAccount(id));
    const removeAccount = (id: number) => dispatch(deleteAccount(id));
    const updateAccount = (data) => {
        dispatch(updateOrCreateAccount({ id: accountData.id, ...data }));
    }
    const addAccount = (accountData: any, S_KEY: string) => {
        if (accountData.id) {
            dispatch(updateOrCreateAccount({ ...accountData, S_KEY }));
            dispatch(setAccountData({ ...accountData, S_KEY }));
            dispatch(switchAccount(accountData.id));
            dispatch(setAuthorized(true));
        }
    };
    const updateOrCreateLink = (data) => {
        const currentLinks = accountData.links || [];

        const newLinks = currentLinks.some(link => link.id === data.id)
          ? currentLinks.map(link => link.id === data.id ? { ...link, ...data } : link)
          : [...currentLinks, data];
      
        dispatch(updateOrCreateAccount({
          id: accountData.id,
          links: newLinks,
        }));
    }

    return {
        isAuthorized,
        isSocketAuthorized,
        accountData,
        accounts,
        setSocketAuthorized: socketAuthorize,
        switchAccount: switchUserAccount,
        deleteAccount: removeAccount,
        addAccount: addAccount,
        updateAccount: updateAccount,
        updateOrCreateLink: updateOrCreateLink
    };
};