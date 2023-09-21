import { ServerRequest } from "../utilities/requests.ts";


export class Role {
    private static readonly roles: Role[] = [];

    static async all(): Promise<Role[]> {
        if (Role.roles.length) {
            return Role.roles;
        }

        return ServerRequest.post('/roles/all', null, { cached: true })
            .then((roles) => roles.map((r: any) => {
                new Role(r.name, r.description);
            }));
    }

    constructor(
        public readonly name: string,
        public readonly description: string
    ) {
        if (!Role.roles.find(r => r.name == name)) {
            Role.roles.push(this);
        }
    }
}