// This is essentially an extension off of an account. It is used to manage members of the site, their bios, resumes, and other information.
// This isn't documented yet because I'm still working on it. It's not a priority right now.

import { DB } from '../utilities/databases.ts';
import Account from './accounts.ts';
import { EmailType } from '../utilities/email.ts';
import { deleteUpload } from '../utilities/files.ts';
import {
    Member as MemberObj,
    MemberSafe,
    MembershipStatus,
} from '../../shared/db-types.ts';
import { Next } from './app/app.ts';
import { Req } from './app/req.ts';
import { Res } from './app/res.ts';
import env from '../../server/utilities/env.ts';

export enum MemberReturnStatus {
    invalidBio = 'invalidBio',
    invalidTitle = 'invalidTitle',
    invalidResume = 'invalidResume',
    success = 'success',
    hasSkill = 'hasSkill',
    noSkill = 'noSkill',
    skillAdded = 'skillAdded',
    skillRemoved = 'skillRemoved',
}

export class Member {
    static async canManage(
        req: Req<{
            username: string;
        }>,
        res: Res,
        next: Next,
    ) {
        const { username } = req.body;
        const self = await req.session.getAccount();
        if (!self) return res.sendStatus('account:not-logged-in');
        if (self.username === username) return next(); // can manage self

        const account = await Account.fromUsername(username);
        if (!account) return res.sendStatus('account:not-found');

        const selfRank = self.getRank;
        const rank = account.getRank;

        if (selfRank < rank) return next();

        res.sendStatus('member:cannot-manage');
    }

    static async isMember(req: Req, res: Res, next: Next) {
        const account = await req.session.getAccount();

        if (!account) {
            req.session.prevUrl = req.pathname;
            return res.sendStatus('account:not-logged-in');
        }

        const member = await Member.get(account.username);
        if (!member || member.status !== 'accepted') {
            return res.redirect('/member/become-member');
        }

        next();
    }

    static async newMember(account: Account): Promise<MembershipStatus> {
        // if the account was rejected, they can request again.

        const sendEmail = (message: string) => {
            account.sendEmail('sfzMusic Membership Request', EmailType.text, {
                constructor: {
                    message,
                    title: 'sfzMusic Membership Request',
                },
            });
        };

        const isMember = await Member.get(account.username);

        if (isMember) {
            if (isMember.status === 'rejected') {
                await DB.run('member/update-status', {
                    status: 'twicePending',
                    id: account.id,
                });

                sendEmail(
                    'You have re-requested to join sfzMusic. After this request, you cannot request again. You will receive another email when your request has been approved.',
                );
                return 'pending';
            } else {
                return isMember.status;
            }
        }

        const { id } = account;

        await DB.run('member/new', {
            id: account.id,
            status: 'pending',
        });

        sendEmail(
            'You have requested to join sfzMusic. You will receive another email when your request has been approved.',
        );

        new Member({
            id,
            bio: '',
            title: '',
            resume: '',
            status: 'pending',
        });

        return 'pending';
    }

    static async get(username: string): Promise<Member | undefined> {
        const data = await DB.get('member/from-username', {
            username,
        });
        if (data.isOk() && data.value) return new Member(data.value);
        return undefined;
    }

    static async getMembers(): Promise<Member[]> {
        const res = await DB.all('member/all');
        if (res.isOk()) return res.value.map((m: MemberObj) => new Member(m));
        return [];
    }

    public readonly id: string;
    public bio?: string;
    public title?: string;
    public resume?: string;
    public status: MembershipStatus;

    constructor(memberInfo: MemberObj) {
        this.id = memberInfo.id;
        this.bio = memberInfo.bio;
        this.title = memberInfo.title;
        this.resume = memberInfo.resume;
        this.status = memberInfo.status as MembershipStatus;
    }

    async accept() {
        DB.run('member/update-status', {
            status: 'accepted',
            id: this.id,
        });

        this.status = 'accepted';

        const account = await Account.fromId(this.id);
        if (!account) return;

        account.sendEmail(
            `${env.TITLE} Membership Request Accepted`,
            EmailType.text,
            {
                constructor: {
                    message:
                        'Your request to join sfzMusic has been accepted. You can now log in to your account and access the member portal.',
                    title: 'sfzMusic Membership Request Accepted',
                },
            },
        );
    }

    reject() {
        if (this.status === 'twicePending') {
            DB.run('member/update-status', {
                status: 'notAllowed',
                id: this.id,
            });

            this.status = 'notAllowed';
            return;
        }
        DB.run('member/update-status', {
            status: 'rejected',
            id: this.id,
        });

        this.status = 'rejected';
    }

    async revoke() {
        DB.run('member/delete', {
            id: this.id,
        });
        const account = await Account.fromId(this.id);
        if (!account) return;
        account.sendEmail(`${env.TITLE} Membership Revoked`, EmailType.text, {
            constructor: {
                message:
                    'Your membership to sfzMusic has been revoked. You can no longer access the member portal.',
                title: 'sfzMusic Membership Revoked',
            },
        });
    }

    async safe(): Promise<MemberSafe> {
        return {
            id: this.id,
            bio: this.bio,
            title: this.title,
            resume: this.resume,
            status: this.status as MembershipStatus,
            // skills: this.getSkills()
        } as MemberSafe;
    }

    changeBio(bio: string) {
        if (!Account.isValid(bio, [' '])) return MemberReturnStatus.invalidBio;

        DB.run('member/update-bio', {
            bio: bio,
            id: this.id,
        });

        this.bio = bio;

        return MemberReturnStatus.success;
    }

    changeTitle(title: string) {
        if (!Account.isValid(title, [' '])) {
            return MemberReturnStatus.invalidTitle;
        }

        DB.run('member/update-title', {
            title,
            id: this.id,
        });

        this.title = title;

        return MemberReturnStatus.success;
    }

    // async addSkill(...skills: { skill: string, years: number }[]): Promise<MemberReturnStatus[]> {
    //     return Promise.all(skills.map(async(skill) => {

    //         const exists = await DB.get('member/get-skill', {
    //             id: this.id,
    //             skill: skill.skill
    //         });
    //         if (exists) return MemberReturnStatus.hasSkill;

    //         await DB.run('member/add-skill', {
    //             id: this.id,
    //             skill: skill.skill,
    //             years: Math.round(skill.years * 10) / 10
    //         });
    //         return MemberReturnStatus.skillAdded;
    //     }));
    // }

    // async removeSkill(...skills: string[]): Promise<MemberReturnStatus[]> {
    //     return Promise.all(skills.map(async(skill) => {
    //         const exists = await DB.get('member/get-skill', {
    //             id: this.id,
    //             skill
    //         });
    //         if (!exists) return MemberReturnStatus.noSkill;

    //         await DB.run('member/remove-skill', {
    //             id: this.id,
    //             skill
    //         });
    //         return MemberReturnStatus.skillRemoved;
    //     }));
    // }

    // getSkills(): Skill[] {
    //     return DB.all('member/skills', {
    //         id: this.id
    //     });
    // }

    changeResume(id: string) {
        const { resume } = this;
        if (resume) {
            deleteUpload(resume + '.pdf');
        }

        this.resume = resume;

        DB.run('member/update-resume', {
            resume: id,
            id: this.id,
        });
    }

    addToBoard() {
        return DB.run('member/add-to-board', {
            id: this.id,
        });
    }

    removeFromBoard() {
        return DB.run('member/remove-from-board', {
            id: this.id,
        });
    }
}
