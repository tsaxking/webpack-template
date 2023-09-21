import { NextFunction, Request, Response } from "npm:express";
import { DB } from "../utilities/databases.ts";
import Account from "./accounts.ts";
import { EmailType } from "../utilities/email.ts";
import { Status } from "../utilities/status.ts";
import { io } from "../structure/socket.ts";
import { deleteUpload } from "../utilities/files.ts";
import { MembershipStatus, Member as MemberObj, MemberSafe, Skill } from "../../shared/db-types.ts";





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

export class Member {
    public static members: {
        [username: string]: Member
    } = {};





    static async canManage(req: Request, res: Response, next: NextFunction) {
        const { username } = req.body;
        const self = req.session.account;
        if (!self) return Status.from('account.notLoggedIn', req).send(res);
        if (self.username === username) return next(); // can manage self

        const account = await Account.fromUsername(username);
        if (!account) return Status.from('account.notFound', req).send(res);

        const selfRank = await self.getRank();
        const rank = await account.getRank();

        if (selfRank < rank) return next();

        Status.from('member.cannotManage', req).send(res);
    }

    static async isMember(req: Request, res: Response, next: NextFunction) {
        const { account } = req.session;

        if (!account) {
            req.session.prevUrl = req.originalUrl;
            return Status.from('account.notLoggedIn', req).send(res);
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
                    title: 'sfzMusic Membership Request'
                }
            });
        }

        const isMember = await Member.get(account.username);

        if (isMember) {
            if (isMember.status === 'rejected') {
                await DB.run('member/update-status', {
                    status: 'twicePending',
                    id: account.id
                });

                sendEmail('You have re-requested to join sfzMusic. After this request, you cannot request again. You will receive another email when your request has been approved.');
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

        sendEmail('You have requested to join sfzMusic. You will receive another email when your request has been approved.');

        new Member({
            id,
            bio: '',
            title: '',
            resume: '',
            status: 'pending'
        });

        return 'pending';
    }

    static async get(username: string): Promise<Member|null> {
        if (Member.members[username]) return Member.members[username];

        const data = await DB.get('member/from-username', {
            username
        });
        if (!data) return null;

        return new Member(data);
    }

    static async getMembers(): Promise<Member[]> {
        if (Object.keys(Member.members).length) return Object.values(Member.members);

        const membersInfo = await DB.all('member/all');

        return membersInfo.map(m => new Member(m));
    }

    public readonly id: string;
    public bio: string;
    public title: string;
    public resume?: string;
    public status: MembershipStatus;



    constructor(memberInfo: MemberObj) {
        this.id = memberInfo.id;
        this.bio = memberInfo.bio;
        this.title = memberInfo.title;
        this.resume = memberInfo.resume;
        this.status = memberInfo.status;

        Member.members[this.id] = this;
    }

    async accept() {
        await DB.run('member/update-status', {
            status: 'accepted',
            id: this.id
        });

        this.status = 'accepted';

        io?.emit('member-accepted', this.id);

        const account = await Account.fromId(this.id);
        if (!account) return;

        account.sendEmail('sfzMusic Membership Request Accepted', EmailType.text, {
            constructor: {
                message: 'Your request to join sfzMusic has been accepted. You can now log in to your account and access the member portal.',
                title: 'sfzMusic Membership Request Accepted'
            }
        });
    }

    async reject() {
        if (this.status === 'twicePending') {

            await DB.run('member/update-status', {
                status: 'notAllowed',
                id: this.id
            });

            this.status = 'notAllowed';
            return;
        }
        await DB.run('member/update-status', {
            status: 'rejected',
            id: this.id
        });

        this.status = 'rejected';
    }

    async revoke() {
        await DB.run('member/delete', {
            id: this.id
        });
        delete Member.members[this.id];

        io?.emit('member-revoked', {
            id: this.id
        });

        const account = await Account.fromId(this.id);
        if (!account) return;
        account.sendEmail('sfzMusic Membership Revoked', EmailType.text, {
            constructor: {
                message: 'Your membership to sfzMusic has been revoked. You can no longer access the member portal.',
                title: 'sfzMusic Membership Revoked'
            }
        });
    }

    async safe(): Promise<MemberSafe> {
        return {
            id: this.id,
            bio: this.bio,
            title: this.title,
            resume: this.resume,
            status: this.status as MembershipStatus,
            skills: this.getSkills()
        } as MemberSafe;
    }


    async changeBio(bio: string) {
        if (!Account.valid(bio, [' '])) return MemberReturnStatus.invalidBio;

        await DB.run('member/update-bio', {
            bio: bio,
            id: this.id
        });

        this.bio = bio;

        return MemberReturnStatus.success;
    }


    async changeTitle(title: string) {
        if (!Account.valid(title, [' '])) return MemberReturnStatus.invalidTitle;

        await DB.run('member/update-title', {
            title,
            id: this.id
        });

        this.title = title;

        return MemberReturnStatus.success;
    }


    async addSkill(...skills: { skill: string, years: number }[]): Promise<MemberReturnStatus[]> {
        return Promise.all(skills.map(async(skill) => {

            const exists = await DB.get('member/get-skill', {
                id: this.id,
                skill: skill.skill
            });
            if (exists) return MemberReturnStatus.hasSkill;

            await DB.run('member/add-skill', {
                id: this.id,
                skill: skill.skill, 
                years: Math.round(skill.years * 10) / 10
            });
            return MemberReturnStatus.skillAdded;
        }));
    }

    async removeSkill(...skills: string[]): Promise<MemberReturnStatus[]> {
        return Promise.all(skills.map(async(skill) => {
            const exists = await DB.get('member/get-skill', {
                id: this.id,
                skill
            });
            if (!exists) return MemberReturnStatus.noSkill;

            await DB.run('member/remove-skill', {
                id: this.id,
                skill
            });
            return MemberReturnStatus.skillRemoved;
        }));
    }

    getSkills(): Skill[] {
        return DB.all('member/skills', {
            id: this.id
        });
    }

    async changeResume(id: string) {
        const { resume } = this;
        if (resume) {
            deleteUpload(resume + '.pdf');
        }

        this.resume = resume;


        await DB.run('member/update-resume', {
            resume: id,
            id: this.id
        });
    }


    async addToBoard() {
        return await DB.run('member/add-to-board', {
            id: this.id
        });
    }

    async removeFromBoard() {
        return await DB.run('member/remove-from-board', {
            id: this.id
        });
    }
}