import { ServerRequest } from '../utilities/requests';
import { Role as R } from '../../shared/db-types';
import { attemptAsync, Result } from '../../shared/attempt';
import { Cache } from './cache';

type Events = {
    new: Role;
};

export class Role extends Cache<Events> {
    private static readonly roles: Role[] = [];

    static async all(): Promise<Result<Role[]>> {
        return attemptAsync(async () => {
            if (Role.roles.length) {
                return Role.roles;
            }

            return (await ServerRequest.post<R[]>('/roles/all', null, {
                cached: true,
            }).then((res) => {
                if (res.isOk()) {
                    return res.value.map((r) => {
                        new Role(r);
                    });
                }
                throw res.error;
            })) as Role[];
        });
    }

    public readonly id: string;
    public readonly name: string;
    public readonly description: string;
    public readonly rank: number;

    constructor(data: R) {
        super();
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.rank = data.rank;

        if (!Role.roles.find((r) => r.name == this.name)) {
            Role.roles.push(this);
        }
    }
}
