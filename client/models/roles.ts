import { ServerRequest } from '../utilities/requests';
import { Role as R } from '../../shared/db-types';

export class Role {
    private static readonly roles: Role[] = [];

    static async all(): Promise<Role[]> {
        if (Role.roles.length) {
            return Role.roles;
        }

        return (await ServerRequest.post<R[]>('/roles/all', null, {
            cached: true,
        }).then((roles) =>
            roles.map((r) => {
                new Role(r.name, r.description);
            })
        )) as Role[];
    }

    constructor(
        public readonly name: string,
        public readonly description: string,
    ) {
        if (!Role.roles.find((r) => r.name == name)) {
            Role.roles.push(this);
        }
    }
}
