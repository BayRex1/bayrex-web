import LinkManager from '../../../services/account/LinkManager.js';

export const addLink = async ({ account, data }) => {
    const linkManager = new LinkManager(account.ID);
    return await linkManager.addLink(data.title, data.link);
}

export const deleteLink = async ({ account, data }) => {
    const linkManager = new LinkManager(account.ID);
    return await linkManager.deleteLink(data.link_id);
}

export const editLink = async ({ account, data }) => {
    const linkManager = new LinkManager(account.ID);
    return await linkManager.editLink(data.link_id, data.title, data.link);
}