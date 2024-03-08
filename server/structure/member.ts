// This is essentially an extension off of an account. It is used to manage members of the site, their bios, resumes, and other information.
// This isn't documented yet because I'm still working on it. It's not a priority right now.

import { DB } from '../utilities/databases';
import Account from './accounts';
import { EmailType } from '../utilities/email';
import { removeUpload } from '../utilities/files';
import {
    Member as MemberObj,
    MemberSafe,
    MembershipStatus
} from '../../shared/db-types';
import { Next } from './app/app';
import { Req } from './app/req';
import { Res } from './app/res';
import env from '../utilities/env';

/**
 * A member's status
 * @date 3/8/2024 - 6:09:32 AM
 *
 * @export
 * @enum {number}
 */
export enum MemberReturnStatus {
    invalidBio = 'invalidBio',
    invalidTitle = 'invalidTitle',
    invalidResume = 'invalidResume',
    success = 'success',
    hasSkill = 'hasSkill',
    noSkill = 'noSkill',
    skillAdded = 'skillAdded',
    skillRemoved = 'skillRemoved'
}

/**
 * Member class
 * @date 3/8/2024 - 6:09:32 AM
 *
 * @export
 * @class Member
 * @typedef {Member}
 */
export class Member {
    /**
     * Checks if the user can manage the member
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @static
     * @async
     * @param {Req<{
     *             username: string;
     *         }>} req
     * @param {Res} res
     * @param {Next} next
     * @returns {unknown}
     */
    static async canManage(
        req: Req<{
            username: string;
        }>,
        res: Res,
        next: Next
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

    /**
     * Checks if the user is a member
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @static
     * @async
     * @param {Req} req
     * @param {Res} res
     * @param {Next} next
     * @returns {unknown}
     */
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

    /**
     * Creates a new member from an account
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @static
     * @async
     * @param {Account} account
     * @returns {Promise<MembershipStatus>}
     */
    static async newMember(account: Account): Promise<MembershipStatus> {
        // if the account was rejected, they can request again.

        const sendEmail = (message: string) => {
            account.sendEmail('sfzMusic Membership Request', EmailType.text, {
                constructor: {
                    message,
                    title: 'sfzMusic Membership Request'
                }
            });
        };

        const isMember = await Member.get(account.username);

        if (isMember) {
            if (isMember.status === 'rejected') {
                await DB.run('member/update-status', {
                    status: 'twicePending',
                    id: account.id
                });

                sendEmail(
                    'You have re-requested to join sfzMusic. After this request, you cannot request again. You will receive another email when your request has been approved.'
                );
                return 'pending';
            } else {
                return isMember.status;
            }
        }

        const { id } = account;

        await DB.run('member/new', {
            id: account.id,
            status: 'pending'
        });

        sendEmail(
            'You have requested to join sfzMusic. You will receive another email when your request has been approved.'
        );

        new Member({
            id,
            bio: '',
            title: '',
            resume: '',
            status: 'pending'
        });

        return 'pending';
    }

    /**
     * Gets a member from their username
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @static
     * @async
     * @param {string} username
     * @returns {Promise<Member | undefined>}
     */
    static async get(username: string): Promise<Member | undefined> {
        const data = await DB.get('member/from-username', {
            username
        });
        if (data.isOk() && data.value) return new Member(data.value);
        return undefined;
    }

    /**
     * Gets all members
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @static
     * @async
     * @returns {Promise<Member[]>}
     */
    static async getMembers(): Promise<Member[]> {
        const res = await DB.all('member/all');
        if (res.isOk()) return res.value.map((m: MemberObj) => new Member(m));
        return [];
    }

    /**
     * The member's id
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @public
     * @readonly
     * @type {string}
     */
    public readonly id: string;
    /**
     * A short bio of the member
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @public
     * @type {?string}
     */
    public bio?: string;
    /**
     * The member's title
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @public
     * @type {?string}
     */
    public title?: string;
    /**
     * The member's resume
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @public
     * @type {?string}
     */
    public resume?: string;
    /**
     * Current status of the member
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @public
     * @type {MembershipStatus}
     */
    public status: MembershipStatus;

    /**
     * Creates an instance of Member.
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @constructor
     * @param {MemberObj} memberInfo
     */
    constructor(memberInfo: MemberObj) {
        this.id = memberInfo.id;
        this.bio = memberInfo.bio;
        this.title = memberInfo.title;
        this.resume = memberInfo.resume;
        this.status = memberInfo.status as MembershipStatus;
    }

    /**
     * Accepts a member's request
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @async
     * @returns {*}
     */
    async accept() {
        DB.run('member/update-status', {
            status: 'accepted',
            id: this.id
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
                    title: 'sfzMusic Membership Request Accepted'
                }
            }
        );
    }

    /**
     * Rejects a member's request
     * @date 3/8/2024 - 6:09:32 AM
     */
    reject() {
        if (this.status === 'twicePending') {
            DB.run('member/update-status', {
                status: 'notAllowed',
                id: this.id
            });

            this.status = 'notAllowed';
            return;
        }
        DB.run('member/update-status', {
            status: 'rejected',
            id: this.id
        });

        this.status = 'rejected';
    }

    /**
     * Revokes a member's membership
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @async
     * @returns {*}
     */
    async revoke() {
        DB.run('member/delete', {
            id: this.id
        });
        const account = await Account.fromId(this.id);
        if (!account) return;
        account.sendEmail(`${env.TITLE} Membership Revoked`, EmailType.text, {
            constructor: {
                message:
                    'Your membership to sfzMusic has been revoked. You can no longer access the member portal.',
                title: 'sfzMusic Membership Revoked'
            }
        });
    }

    /**
     * Builds a safe object of the member for public use
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @async
     * @returns {Promise<MemberSafe>}
     */
    async safe(): Promise<MemberSafe> {
        return {
            id: this.id,
            bio: this.bio,
            title: this.title,
            resume: this.resume,
            status: this.status as MembershipStatus
            // skills: this.getSkills()
        } as MemberSafe;
    }

    /**
     * Changes the member's bio
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @param {string} bio
     * @returns {(MemberReturnStatus.invalidBio | MemberReturnStatus.success)}
     */
    changeBio(bio: string) {
        if (!Account.isValid(bio, [' '])) return MemberReturnStatus.invalidBio;

        DB.run('member/update-bio', {
            bio: bio,
            id: this.id
        });

        this.bio = bio;

        return MemberReturnStatus.success;
    }

    /**
     * Changes the member's title
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @param {string} title
     * @returns {(MemberReturnStatus.invalidTitle | MemberReturnStatus.success)}
     */
    changeTitle(title: string) {
        if (!Account.isValid(title, [' '])) {
            return MemberReturnStatus.invalidTitle;
        }

        DB.run('member/update-title', {
            title,
            id: this.id
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

    /**
     * Changes the member's resume
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @param {string} id
     */
    changeResume(id: string) {
        const { resume } = this;
        if (resume) {
            removeUpload(resume + '.pdf');
        }

        this.resume = resume;

        DB.run('member/update-resume', {
            resume: id,
            id: this.id
        });
    }

    /**
     * Adds the member to the board
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @returns {Promise<Result<Queries>>}
     */
    addToBoard() {
        return DB.run('member/add-to-board', {
            id: this.id
        });
    }

    /**
     * Removes the member from the board
     * @date 3/8/2024 - 6:09:32 AM
     *
     * @returns {Promise<Result<Queries>>}
     */
    removeFromBoard() {
        return DB.run('member/remove-from-board', {
            id: this.id
        });
    }
}
