import Config from '../system/global/Config.js';
import DatabaseManager from './DatabaseManager.js';

export const dbE = new DatabaseManager(Config.ELEMENT_DATABASE);
export const dbM = new DatabaseManager(Config.MESSENGER_DATABASE);
export const dbA = new DatabaseManager(Config.APPS_DATABASE);
