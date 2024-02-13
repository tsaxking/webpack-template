// this file contains all the types that are used in the database for sending/receiving data to/from the server

export type Account = {
    id: string;
    username: string;
    key: string;
    salt: string;
    firstName: string;
    lastName: string;
    email: string;
    passwordChange?: string;
    verified: number;
    verification?: string;
    emailChange?: string;
    passwordChangeDate?: number;
    created: number;
    phoneNumber?: string;
    picture?: string;
};

export type AccountSafe = {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    verified: number;
    created: number;
    phoneNumber: string;
    picture?: string;
    id: string;
};

export type MembershipStatus =
    | 'pending'
    | 'twicePending'
    | 'accepted'
    | 'rejected'
    | 'notAllowed'
    | 'notMember';

export type Member = {
    id: string;
    title?: string;
    status?: string;
    bio?: string;
    resume?: string;
};

export type MemberSafe = Member & {
    skills: Skill[];
    status: MembershipStatus;
};

export type Role = {
    id: string;
    name: string;
    description: string | undefined;
    rank: number;
};

export type AccountRole = {
    accountId: string;
    roleId: string;
};

export type RolePermission = {
    permission: string;
    description?: string;
};

export type Skill = {
    id: string;
    skill: string;
    years: number;
};

export type DiscordLink = {
    id: string;
    discordId: string;
    created: number;
    username: string;
};

export type AccountSettings = {
    accountId: string;
    settings: string;
};
