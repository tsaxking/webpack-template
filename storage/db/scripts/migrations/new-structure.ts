import { Version } from '../../../../server/utilities/database/versions';
import { Account } from '../../../../server/structure/structs/account';
import { Session } from '../../../../server/structure/structs/session';
import { resolveAll } from '../../../../shared/check';

export default new Version(
    'Migrate old tables to structs',
    [2, 0, 0],
    async db => {
        // grouping the different migrations together to avoid memory issues
        // TODO: remove depedency on query files

        // Accounts
        await (async () => {
            const account = (await db.all('account/all')).unwrap();
            const notifications = (
                await db.all('account-notifications/all')
            ).unwrap();
            (
                await db.unsafe.run(db.Query.build(`DROP TABLE Accounts;`))
            ).unwrap();
            (
                await db.unsafe.run(
                    db.Query.build(`DROP TABLE AccountNotifications;`)
                )
            ).unwrap();

            // There isn't much implementation for settings right now, so we're just going to drop it.
            (
                await db.unsafe.run(
                    db.Query.build('DROP TABLE AccountSettings;')
                )
            ).unwrap();

            const built = resolveAll(
                await Promise.all([
                    Account.Account.build(),
                    Account.DiscordLink.build(),
                    Account.PasswordChange.build(),
                    Account.EmailChange.build(),
                    Account.Notification.build(),
                    Account.CustomData.build(),
                    Account.Settings.build()
                ])
            );
            built.unwrap();

            await Promise.all(
                account.map(async a => {
                    const newAccount = (
                        await Account.Account.new({
                            username: a.username,
                            key: a.key,
                            salt: a.salt,
                            firstName: a.firstName,
                            lastName: a.lastName,
                            email: a.email,
                            picture: a.picture || '',
                            verified: !!a.verified,
                            verification: a.verification || ''
                        })
                    ).unwrap();
                    if (a.customData) {
                        const data = JSON.parse(a.customData) || {};
                        (
                            await Account.CustomData.new({
                                accountId: newAccount.id,
                                ...data // this will throw an error if it doesn't work, which is perfect for debugging
                            })
                        ).unwrap();
                    }

                    // Ignore email changes, they're an unsafe json and haven't been integrated

                    const notifs = notifications.filter(
                        n => n.accountId === a.id
                    );

                    await Promise.all(
                        notifs.map(async n => {
                            Account.Notification.new({
                                accountId: newAccount.id,
                                data: n.data,
                                read: !!n.read,
                                message: n.message,
                                title: n.title,
                                type: n.type
                            });
                        })
                    );
                })
            );
        })();

        // Sessions
        await (async () => {
            const sessions = (await db.all('sessions/all'))
                .unwrap()
                .filter(s => !!s.accountId); // ignore sessions that aren't signed in

            (
                await db.unsafe.run(db.Query.build(`DROP TABLE Sessions;`))
            ).unwrap();

            const built = resolveAll(
                await Promise.all([
                    Session.Session.build(),
                    Session.Blacklist.build(),
                    Session.CustomData.build()
                ])
            );

            built.unwrap();

            await Promise.all(
                sessions.map(async s => {
                    const newSession = (
                        await Session.Session.new({
                            accountId: s.accountId || '',
                            ip: s.ip || '127.0.0.1',
                            userAgent: s.userAgent || 'unknown',
                            requests: s.requests,
                            prevUrl: s.prevUrl || ''
                        })
                    ).unwrap();

                    if (s.customData) {
                        Session.CustomData.new({
                            ...(JSON.parse(s.customData) || {}),
                            sessionId: newSession.id
                        });
                    }
                })
            );
        })();

        // Roles
        // I'm just going to restart roles from scratch because universes exist now and rank is irrelevant
        await (async () => {
            await Promise.all([
                db.unsafe.run(db.Query.build('DROP TABLE Roles;')),
                db.unsafe.run(db.Query.build('DROP TABLE AccountRoles;')),
                db.unsafe.run(db.Query.build('DROP TABLE Permissions;')),
                db.unsafe.run(db.Query.build('DROP TABLE RolePermissions;'))
            ]);
        })();
    }
);
