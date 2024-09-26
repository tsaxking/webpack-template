import crypto from 'crypto';
import { Backup, DB } from '../server/utilities/databases';
import { prompt } from './prompt';
import { saveFile, readFile } from '../server/utilities/files';

const main = async () => {
    console.clear();
    type BackupData = {
        iv: string;
        data: string;
        name: string;
    };

    const [, , ...args] = process.argv;
    if (!args.length) {
        console.log('Usage: npm run encrypt-backup [new|open|uuid]');
        process.exit(1);
    }

    if (args.includes('new-key')) {
        console.log('Your new key:', crypto.randomBytes(32).toString('hex'));
        process.exit(0);
    }

    if (args.includes('new')) {
        const backup = (await Backup.makeBackup()).unwrap();
        const data = (await backup.open()).unwrap();

        const hexKey = await prompt(
            'Enter the key to encrypt the backup with: '
        );
        const key = Buffer.from(hexKey, 'hex');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            Buffer.from(key),
            iv
        );
        const encrypted = Buffer.concat([
            cipher.update(JSON.stringify(data)),
            cipher.final()
        ]);

        const b: BackupData = {
            iv: iv.toString('hex'),
            data: encrypted.toString('hex'),
            name: backup.serialize()
        };

        (await saveFile('./.backup', JSON.stringify(b))).unwrap();
        console.log('Backup file created.');
        process.exit(0);
    }

    if (args.includes('open')) {
        console.clear();
        const hexKey = await prompt(
            'Enter the key to decrypt the backup with: '
        );
        const key = Buffer.from(hexKey, 'hex');
        const backup = await readFile('./.backup');
        if (backup.isErr()) {
            console.log('No backup file found.');
            process.exit(1);
        }

        const d: BackupData = JSON.parse(backup.value);

        if (
            !Object.keys(d).includes('iv') ||
            !Object.keys(d).includes('data') ||
            !Object.keys(d).includes('name')
        ) {
            console.log('Invalid backup file.');
            process.exit(1);
        }

        const iv = Buffer.from(d.iv, 'hex');
        const encryptedText = Buffer.from(d.data, 'hex');
        const name = d.name;

        console.log('Generating backup file: ', name);

        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            Buffer.from(key),
            iv
        );
        const decrypted = Buffer.concat([
            decipher.update(encryptedText),
            decipher.final()
        ]);
        const data = decrypted.toString();

        (await saveFile(`./storage/db/backups/${name}.json`, data)).unwrap();

        const thisBackup = Backup.from(name).unwrap();
        (await Backup.restoreBackup(thisBackup)).unwrap();
        console.log('Backup restored.');
        process.exit(0);
    }
};

if (require.main === module) {
    DB.em.on('connect', main);
}
