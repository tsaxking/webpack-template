import { attempt, attemptAsync, Result } from '../../shared/check';

/**
 * Download a file from a URL
 * @date 1/26/2024 - 1:03:26 AM
 *
 * @async
 */
export const downloadUrl = async (url: string, filename: string) => {
    return attempt(() => {
        const element = document.createElement('a');
        element.setAttribute('href', url);
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    });
};

/**
 * Downloads a blob
 * @date 1/26/2024 - 1:03:26 AM
 *
 * @async
 */
export const downloadBlob = async (blob: Blob, filename: string) => {
    return attempt(() => {
        const url = window.URL.createObjectURL(blob);
        return downloadUrl(url, filename);
    });
};

/**
 * Downloads a text file
 * @date 1/26/2024 - 1:03:26 AM
 *
 * @async
 */
export const downloadText = async (text: string, filename: string) => {
    return downloadBlob(new Blob([text]), filename);
};

/**
 * Returns a file list from the user
 * @date 1/26/2024 - 1:03:25 AM
 */
export const loadFiles = (): Promise<Result<FileList>> => {
    return attemptAsync(async () => {
        return new Promise<FileList>((res, rej) => {
            const element = document.createElement('input');
            element.setAttribute('type', 'file');
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);

            element.onchange = () => {
                const { files } = element;
                if (files) {
                    res(files);
                } else {
                    rej(new Error('No files selected'));
                }
            };
        });
    });
};

/**
 * Returns the contents of files from the user
 * @date 1/26/2024 - 1:03:25 AM
 */
export const loadFileContents = (): Promise<
    Result<
        {
            name: string;
            text: string;
        }[]
    >
> => {
    return attemptAsync(async () => {
        const res = await loadFiles();
        if (res.isOk()) {
            const files = Array.from(res.value);

            const contents = await Promise.all(
                files.map(async (file) => {
                    const text = await file.text();
                    if (!text) {
                        throw new Error(`File ${file.name} is empty`);
                    }
                    return { name: file.name, text };
                }),
            );

            return contents;
        } else {
            throw res.error;
        }
    });
};
