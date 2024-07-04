import { DB } from '../utilities/databases';
import crypto from 'node:crypto';
import { uuid } from '../utilities/uuid';
import { Status } from '../utilities/status';
import { Email, EmailOptions, EmailType } from '../utilities/email';
import Filter from 'bad-words';
import { Member } from './member';
import {
    Account as AccountObject,
    AccountSettings
} from '../../shared/db-types';
import env from '../utilities/env';
import { removeUpload } from '../utilities/files';
import { Next, ServerFunction } from './app/app';
import { Req } from './app/req';
import { Res } from './app/res';
import { AccountStatusId, RolesStatusId } from '../../shared/status-messages';
import { validate } from '../middleware/data-type';
import { Role as RoleObj } from '../../shared/db-types';
import { Permission } from '../../shared/permissions';
import { attemptAsync } from '../../shared/check';
import { RolePermission } from '../../shared/db-types';
import Role from './roles';


export default class Account {

}