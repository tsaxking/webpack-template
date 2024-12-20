import { attemptAsync } from '../../shared/check';
import { exec } from './run-task';

export const gitBranch = () => exec('git branch --show-current');

export const gitCommit = () =>
    attemptAsync(async () => {
        const commit = (await exec('git rev-parse HEAD')).unwrap();
        // last 7 characters of the commit
        return commit.slice(0, 7);
    });
