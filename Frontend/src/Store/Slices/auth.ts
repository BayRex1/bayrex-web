import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Account {
    id: number;
    S_KEY: string;
    links?: any[];
    [key: string]: any;
}

interface AuthState {
    isAuthorized: boolean;
    isSocketAuthorized: boolean;
    accountData: Account | null;
    accounts: Account[];
}

const getAccountFromLocalStorage = (id: number): Account | null => {
    const accountsArray: Account[] = JSON.parse(localStorage.getItem('Accounts') || '[]');
    return accountsArray.find((account) => account.id === id) || null;
};

const initialState: AuthState = {
    isAuthorized: Boolean(getAccountFromLocalStorage(parseInt(localStorage.getItem('SelectedAccount') || '0'))),
    isSocketAuthorized: false,
    accountData: getAccountFromLocalStorage(parseInt(localStorage.getItem('SelectedAccount') || '0')),
    accounts: JSON.parse(localStorage.getItem('Accounts') || '[]'),
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthorized(state, action: PayloadAction<boolean>) {
            state.isAuthorized = action.payload;
        },
        setSocketAuthorized(state, action: PayloadAction<boolean>) {
            state.isSocketAuthorized = action.payload;
        },
        setAccountData(state, action: PayloadAction<Account | null>) {
            state.accountData = action.payload;
        },
        updateOrCreateAccount(state, action: PayloadAction<any>) {
            const index = state.accounts.findIndex(account => account.id === action.payload.id);

            let updatedMessengerNotifications;
            let updatedNotifications;
            let updatedEBalls;

            if (action.payload.hasOwnProperty('messenger_notificationsDelta')) {
                const baseValue = index !== -1
                    ? (state.accounts[index].messenger_notifications || 0)
                    : (action.payload.messenger_notifications || 0);
                updatedMessengerNotifications = Math.max(baseValue + action.payload.messenger_notificationsDelta, 0);
            }
            if (action.payload.hasOwnProperty('notificationsDelta')) {
                const baseValue = index !== -1
                    ? (state.accounts[index].notifications || 0)
                    : (action.payload.notifications || 0);
                updatedNotifications = Math.max(baseValue + action.payload.notificationsDelta, 0);
            }
            if (action.payload.hasOwnProperty('e_ballsDelta')) {
                const baseValue = index !== -1
                    ? (state.accounts[index].e_balls || 0)
                    : (action.payload.e_balls || 0);
                updatedEBalls = Math.max(baseValue + action.payload.e_ballsDelta, 0);
            }

            if (index !== -1) {
                state.accounts[index] = {
                    ...state.accounts[index],
                    ...action.payload,
                    ...(updatedMessengerNotifications !== undefined
                        ? { messenger_notifications: updatedMessengerNotifications }
                        : {}),
                    ...(updatedNotifications !== undefined
                        ? { notifications: updatedNotifications }
                        : {}),
                    ...(updatedEBalls !== undefined
                        ? { e_balls: updatedEBalls }
                        : {})
                };
            } else {
                const newAccount = {
                    ...action.payload,
                    ...(updatedMessengerNotifications !== undefined
                        ? { messenger_notifications: updatedMessengerNotifications }
                        : {}),
                    ...(updatedNotifications !== undefined
                        ? { notifications: updatedNotifications }
                        : {}),
                    ...(updatedEBalls !== undefined
                        ? { e_balls: updatedEBalls }
                        : {})
                };
                state.accounts.push(newAccount);
            }

            if (state.accountData?.id === action.payload.id) {
                state.accountData = {
                    ...state.accountData,
                    ...action.payload,
                    ...(updatedMessengerNotifications !== undefined
                        ? { messenger_notifications: updatedMessengerNotifications }
                        : {}),
                    ...(updatedNotifications !== undefined
                        ? { notifications: updatedNotifications }
                        : {}),
                    ...(updatedEBalls !== undefined
                        ? { e_balls: updatedEBalls }
                        : {})
                };
            }

            localStorage.setItem('Accounts', JSON.stringify(state.accounts));
        },
        switchAccount(state, action: PayloadAction<number>) {
            const selectedAccount = state.accounts.find((account) => account.id === action.payload);
            if (selectedAccount) {
                localStorage.setItem('SelectedAccount', String(selectedAccount.id));
                localStorage.setItem('S_KEY', selectedAccount.S_KEY);
                state.accountData = selectedAccount;
            }
        },
        deleteAccount(state, action: PayloadAction<number>) {
            const updatedAccounts = state.accounts.filter((account) => account.id !== action.payload);
            state.accounts = updatedAccounts;
            localStorage.setItem('Accounts', JSON.stringify(updatedAccounts));
        },
    },
});

export const {
    setAuthorized,
    setSocketAuthorized,
    setAccountData,
    updateOrCreateAccount,
    switchAccount,
    deleteAccount,
} = authSlice.actions;

export default authSlice.reducer;