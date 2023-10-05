import { CBS_Container } from "../submodules/custom-bootstrap/src/components/0-grid/container";
import { CBS_Input } from "../submodules/custom-bootstrap/src/components/form-inputs/1-input";
import { CBS_FileInput } from "../submodules/custom-bootstrap/src/components/form-inputs/file";
import { ViewUpdate } from "../utilities/socket";
import CBS, { CBS_ElementContainer } from "../submodules/custom-bootstrap/src/1-main/1-main";
import { capitalize, fromCamelCase } from "../../shared/text";
import { ServerRequest } from "../utilities/requests";
import { Skill, MembershipStatus, MemberSafe as MemberInfo } from "../../shared/db-types";
import { CBS_Modal } from "../submodules/custom-bootstrap/src/components/1-general/modal";
import { PDF } from "./pdf";
import { Account } from "./account";
import { CBS_ListItem } from "../submodules/custom-bootstrap/src/components/list/list-item";
import { CBS_Row } from "../submodules/custom-bootstrap/src/components/0-grid/row";



export class Member {
    static members: { [username: string]: Member } = {};

    public static async getMembers(): Promise<Member[]> {
        if (Object.keys(Member.members).length) return Object.values(Member.members);

        console.log('No members, retrieving from server.');
        
        return ServerRequest.post('/member/get-members')
            .then((members: MemberInfo[]) => members.map(m => new Member(m)));
    };





    public id: string;
    public bio: string;
    public title: string;
    public resume?: PDF;
    public status: MembershipStatus;
    public skills: Skill[];

    constructor(memberInfo: MemberInfo) {
        this.id = memberInfo.id;
        this.bio = memberInfo.bio;
        this.title = memberInfo.title;
        if (memberInfo.resume) {
            this.resume = new PDF(memberInfo.resume, Account.accounts[this.id] + "'s resume");
        }
        this.status = memberInfo.status;
        this.skills = memberInfo.skills;

        Member.members[this.id] = this;
    }

    public filterUsername(username: string) {
        console.log('filter:', username, this.id);
        return this.id.toLowerCase() === username.toLowerCase();
    }


    // changes


    async changeBio(bio: string) {
        return ServerRequest.post('/member/change-bio', {
            id: this.id,
            bio
        });
    }

    async changeTitle(title: string) {
        return ServerRequest.post('/member/change-title', {
            id: this.id,
            title
        });
    }

    async addSkill(skill: string, years: number) {
        return ServerRequest.post('/member/add-skill', {
            years,
            id: this.id,
            skill
        });
    }

    async removeSkill(skill: string) {
        return ServerRequest.post('/member/remove-skill', {
            id: this.id,
            skill
        });
    }

    async changeResume(resume: File) {
        return ServerRequest.post('/member/change-resume', {
            id: this.id,
            resume
        });
    }





    // TODO: create member profile view
    async view(): Promise<CBS_Container> {
        const updates: ViewUpdate[] = [];

        const newUpdate = (name: string, callback: (...args: any[]) => void) => {
            const u = this.newUpdate(name, callback);
            updates.push(u);
        }

        const container = CBS.createElement('container');

        container.addRow().append(CBS.createElement('h4').append(`${this.id}'s Profile`));

        container.addRow().append(CBS.createElement('h6', {
            classes: ['fw-bold']
        }).append('Bio'));
        const bio = CBS.createElement('p').append(this.bio || 'No bio yet')
        container.addRow().append(bio);
        newUpdate(
            'change-bio',
            () => {
                console.log('change-bio', this.bio);
                bio.clearElements();
                bio.append(this.bio || 'No bio yet');
            }
        );

        container.addRow().append(CBS.createElement('h6', {
            classes: ['fw-bold']
        }).append('Title'));
        const title = CBS.createElement('p').append(this.title || 'No title yet');
        container.addRow().append(title);
        newUpdate(
            'change-title',
            () => {
                console.log('change-title', this.title);
                title.clearElements();
                title.append(this.title || 'No title yet');
            }
        );
        

        container.addRow().append(CBS.createElement('h6', {
            classes: ['fw-bold']
        }).append('Skills'));
        const skillArr: CBS_ListItem[] = [];
        const skills = CBS.createElement('list');

        const newSkill = (skill: string, years: number): CBS_ListItem => {
            const li = CBS.createElement('li');
            li.id = 'skill-' + skill.replace(' ', '-').toLowerCase();
            li.append(`[${years}]   ` + capitalize(skill));
            skillArr.push(li);
            return li;
        } 

        for (const skill of this.skills) {
            skills.append(newSkill(skill.skill, skill.years));
        }
        container.addRow().append(skills);

        newUpdate(
            'add-skill',
            (username: string, skill: string, years: number) => {
                skills.append(newSkill(skill, years));
            }
        );

        newUpdate(
            'remove-skill',
            (username: string, skill: string) => {
                console.log('remove-skill', username, skill);
                const s = skillArr.find(s => s.id === 'skill-' + skill.replace(' ', '-').toLowerCase());
                if (s) s.destroy();
            }
        )

        container.addRow().append(CBS.createElement('h6', {
            classes: ['fw-bold']
        }).append('Resume'));
        const canvas = document.createElement('canvas');
        container.addRow().append((await this.resume?.viewer(canvas)) || 'No resume uploaded');


        

        container.on('el.destroy', () => {
            updates.forEach(u => u.destroy());
        });


        return container;
    }

    // TODO: create member management view
    manage(): CBS_Container {
        const updates: ViewUpdate[] = [];
        const container = CBS.createElement('container');

        const newUpdate = (name: string, callback: (...args: any[]) => void) => {
            const u = this.newUpdate(name, callback);
            updates.push(u);
        }

        const createInputGroup = (label: 'resume'| 'bio' | 'skill' | 'title', inputs: CBS_Input[], reset: boolean = false) => {
            const formGroup = CBS.createElement('div');
            formGroup.addClass('form-group', 'mb-3', 'w-100', 'pe-2');
            const labelEl = CBS.createElement('label', {
                classes: ['fw-bold']
            }).append(capitalize(label));
            const button = CBS.createElement('button', {
                color: 'primary'
            }).append(`<i class="material-icons">save</i>`);

            
            const inputGroup = CBS.createElement('input-group');
            inputs.forEach(i => inputGroup.append(i));
            inputGroup.append(button);

            formGroup.append(labelEl, inputGroup);

            button.on('click', () => {
                switch (label) {
                    case 'resume':
                        this.changeResume((inputs[0] as CBS_FileInput).value[0]).then(() => {
                            (inputs[0] as CBS_FileInput).clearFiles();
                        });
                        break;
                    case 'bio':
                        this.changeBio((inputs[0] as CBS_Input).value);
                        break;
                    case 'title':
                        this.changeTitle((inputs[0] as CBS_Input).value);
                        break;
                    case 'skill':
                        this.addSkill((inputs[0] as CBS_Input).value, +(inputs[1] as CBS_Input).value);
                        break;
                }
                if (reset) {
                    inputs.forEach(i => i.value = '');
                }
            });
            container.addRow().append(formGroup);

            if (label === 'resume' || label === 'skill') return;


            inputs[0].value = this[label];

            newUpdate(
                'change-' + label,
                (username, value) => {
                    inputs.forEach(i => i.value = value);
                }
            );

        }


        const bioInput = CBS.createElement('input-textarea');
        bioInput.setAttribute('placeholder', 'Type your bio here');
        createInputGroup('bio', [bioInput]);

        const titleInput = CBS.createElement('input');
        titleInput.setAttribute('placeholder', 'Type your title here');
        createInputGroup('title', [titleInput]);


        const addSkillLabel = (row: CBS_Row, skill: string, years: number) => {
            const div = CBS.createElement('div');
            div.addClass('d-flex', 'justify-content-between', 'align-items-center');

            const remove = CBS.createElement('button', {
                    color: 'danger'
                })
                .append(`<i class="material-icons">close</i>`)
                .on('click', () => {
                    this.removeSkill(skill).then(() => {
                        div.destroy();
                    });
                });

            div.append(CBS.createElement('p', {
                classes: ['m-0', 'p-0']
            }).append(remove, '&nbsp;' +  capitalize(skill) + `  (${years})`));
            row.addCol().append(div);
        }

        const skillsRow = container.addRow();
        if (this.skills.length) skillsRow.append(CBS.createElement('h6', {
            classes: ['fw-bold']
        }).append('Skills'));
        this.skills.forEach(s => addSkillLabel(skillsRow, s.skill, s.years));

        newUpdate(
            'add-skill',
            (username: string, skill: string, years: number) => addSkillLabel(skillsRow, skill, years)
        )

        const skillInput = CBS.createElement('input');
        skillInput.setAttribute('placeholder', 'Skill name');
        const yearInput = CBS.createElement('input');
        yearInput.setAttribute('placeholder', 'Years of experience');

        createInputGroup('skill', [skillInput, yearInput], true);

        const resumeInput = CBS.createElement('input-file');
        createInputGroup('resume', [resumeInput]);


        container.on('el.destroy', () => {
            updates.forEach(u => u.destroy());
        });


        return container;
    }






    async viewManageModal(): Promise<CBS_Modal> {
        const container = CBS.createElement('container');
        const nav = CBS.createElement('tab-nav');
        nav.addClass('nav-tabs');

        container.addRow().append(nav);

        const profile = nav.addPage('Profile', await this.view());
        const manage = nav.addPage('Manage',  this.manage());

        container.addRow().append(profile, manage);

        const modal = CBS.modal(container, {
            title: 'Member',
            size: 'xl',
            destroyOnHide: true
        });

        return modal;
    }

    async viewModal(): Promise<CBS_Modal> {
        const container = CBS.createElement('container');

        const profile = await this.view();

        container.addRow().append(profile);

        const modal = CBS.modal(container, {
            title: 'Member',
            size: 'xl',
            destroyOnHide: true
        });

        return modal;
    }

    async manageModal(): Promise<CBS_Modal> {
        const container = CBS.createElement('container');

        const manage = this.manage();

        container.addRow().append(manage);

        const modal = CBS.modal(container, {
            title: 'Member',
            size: 'xl',
            destroyOnHide: true
        });

        return modal;
    }

    
    private newUpdate(name: string, callback: (...args: any[]) => void) {
        const update = new ViewUpdate(name, null, callback, (username) => this.filterUsername(username));
        return update;
    }



    async addToBoard() {
        return ServerRequest.post('/member/add-to-board', {
            username: this.id
        });
    }
}