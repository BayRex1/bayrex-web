import { dbE } from '../../lib/db.js';
import { send } from '../../notify_service/send.js';
import { getDate } from '../../system/global/Function.js';

export class PunishmentScheduler {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning = false;
    private checkInterval = 60000;

    start() {
        if (this.isRunning) {
            console.log('PunishmentScheduler уже запущен');
            return;
        }

        this.isRunning = true;
        console.log('Запуск PunishmentScheduler...');
        
        this.checkExpiredPunishments();
        
        this.intervalId = setInterval(() => {
            this.checkExpiredPunishments();
        }, this.checkInterval);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('PunishmentScheduler остановлен');
    }

    private async checkExpiredPunishments() {
        try {
            const currentTime = getDate();
            console.log(`Проверка истекших наказаний в ${currentTime}`);
            
            const expiredPunishments = await dbE.query(`
                SELECT 
                    ap.id,
                    ap.user_id,
                    ap.punishment_type,
                    ap.end_date,
                    ac.Username
                FROM accounts_punishments ap
                LEFT JOIN accounts ac ON ap.user_id = ac.ID
                WHERE ap.end_date IS NOT NULL 
                  AND ap.end_date <= ? 
                  AND (ap.is_active = 1 OR ap.is_active IS NULL)
                  AND ap.restored_at IS NULL
                  AND ap.punishment_type IN ('restrict_posts', 'restrict_comments', 'restrict_chat', 'restrict_music', 'ban')
            `, [currentTime]);

            if (expiredPunishments.length === 0) {
                console.log('Истекших наказаний не найдено');
                return;
            }

            console.log(`Найдено ${expiredPunishments.length} истекших ограничений:`);
            
            for (const punishment of expiredPunishments) {
                const endDate = new Date(punishment.end_date);
                const now = new Date();
                const timeDiff = now.getTime() - endDate.getTime();
                
                console.log(`Наказание ID ${punishment.id} (${punishment.Username}): end_date=${punishment.end_date}, текущее время=${currentTime}, разница=${timeDiff}ms`);
                
                if (timeDiff > -60000) {
                    await this.restorePunishment(punishment);
                } else {
                    console.log(`Наказание ID ${punishment.id} еще не истекло, пропускаем`);
                }
            }

        } catch (error) {
            console.error('Ошибка при проверке истекших ограничений:', error);
        }
    }

    private async restorePunishment(punishment: any) {
        try {
            await dbE.withTransaction(async (conn) => {
                const check = await conn.query(
                    'SELECT is_active, restored_at FROM accounts_punishments WHERE id = ? AND restored_at IS NULL',
                    [punishment.id]
                ) as any[];
                
                if (!Array.isArray(check) || check.length < 1) {
                    console.log(`Наказание ${punishment.id} уже обработано, пропускаем`);
                    return;
                }

                let restoreQuery = '';
                let restoreParams = [punishment.user_id];
                
                switch (punishment.punishment_type) {
                    case 'restrict_posts':
                        restoreQuery = 'UPDATE accounts_permissions SET Posts = 1 WHERE UserID = ?';
                        break;
                    case 'restrict_comments':
                        restoreQuery = 'UPDATE accounts_permissions SET Comments = 1 WHERE UserID = ?';
                        break;
                    case 'restrict_chat':
                        restoreQuery = 'UPDATE accounts_permissions SET NewChats = 1 WHERE UserID = ?';
                        break;
                    case 'restrict_music':
                        restoreQuery = 'UPDATE accounts_permissions SET MusicUpload = 1 WHERE UserID = ?';
                        break;
                    case 'ban':
                        restoreQuery = 'UPDATE accounts_permissions SET Posts = 1, Comments = 1, NewChats = 1, MusicUpload = 1 WHERE UserID = ?';
                        break;
                    default:
                        console.log(`Неизвестный тип наказания: ${punishment.punishment_type}`);
                        return;
                }

                if (restoreQuery) {
                    await conn.query(
                        'UPDATE accounts_punishments SET is_active = 0, restored_at = ? WHERE id = ?',
                        [getDate(), punishment.id]
                    );

                    await conn.query(restoreQuery, restoreParams);

                    await conn.query(
                        `INSERT INTO moderation_history 
                         (punishment_id, moderator_id, action_type, target_type, target_id, details, created_at)
                         VALUES (?, 1, 'punishment_lifted', 'user', ?, ?, ?)`,
                        [
                            punishment.id,
                            punishment.user_id,
                            JSON.stringify({
                                punishment_type: punishment.punishment_type,
                                auto_lifted: true,
                                lifted_reason: 'Автоматическое снятие по истечении срока'
                            }),
                            getDate()
                        ]
                    );

                    const restoredPermissions = await conn.query(
                        'SELECT * FROM accounts_permissions WHERE UserID = ?',
                        [punishment.user_id]
                    );
                    
                    if (restoredPermissions && restoredPermissions.length > 0) {
                        const permissions = restoredPermissions[0] as any;
                        
                        await send(punishment.user_id, {
                            from: 1,
                            action: 'permissions_updated',
                            content: {
                                type: 'permissions_updated',
                                payload: {
                                    Posts: !!permissions.Posts,
                                    Comments: !!permissions.Comments,
                                    NewChats: !!permissions.NewChats,
                                    MusicUpload: !!permissions.MusicUpload,
                                    Admin: !!permissions.Admin,
                                    Verified: !!permissions.Verified,
                                    Fake: !!permissions.Fake
                                }
                            }
                        });
                    }
                    
                    await send(punishment.user_id, {
                        from: 1,
                        action: 'notification',
                        content: {
                            type: 'notification',
                            subtype: 'punishment_lifted',
                            title: 'Ограничение снято',
                            message: 'Ограничение автоматически снято по истечении срока',
                            data: {
                                punishment_type: punishment.punishment_type,
                                punishment_id: punishment.id
                            }
                        }
                    });

                    console.log(`Восстановлены права для пользователя ${punishment.Username} (ID: ${punishment.user_id}), тип: ${punishment.punishment_type}`);
                }
            });

        } catch (error) {
            console.error(`Ошибка восстановления прав для пользователя ${punishment.user_id}:`, error);
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            checkInterval: this.checkInterval
        };
    }
}

export const punishmentScheduler = new PunishmentScheduler(); 