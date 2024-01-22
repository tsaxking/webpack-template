/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServerFunction } from '../structure/app/app.ts';

/**
 * Options for the validate function
 * @date 1/9/2024 - 1:16:19 PM
 *
 * @typedef {ValidateOptions}
 */
type ValidateOptions = {
    allowExtra?: boolean;

    /**
     * Called when a value is invalid
     * @param key
     * @param value
     * @returns
     */
    onInvalid?: (key: string, value: any) => void;

    /**
     * Called when a value is missing
     * @param key
     * @returns
     */
    onMissing?: (key: string) => void;

    log?: true;
};

type AllowedPrimitive = 'string' | 'number' | 'boolean' | 'undefined';

type IsValid =
    | AllowedPrimitive
    | AllowedPrimitive[]
    | (string | number | boolean)[]
    | ((data: any) => boolean);

/**
 * Creates a middleware function that validates the req.body, ensuring that all data is both present and the correct type
 * @date 1/9/2024 - 1:16:19 PM
 */
export const validate = <type = unknown>(
    data: {
        // each key is a key in the type generic
        [key in keyof type]: IsValid;
    },
    options?: ValidateOptions,
): ServerFunction<type> => {
    return (req, res, next) => {
        const { body } = req;

        let passed = true;
        const missing: string[] = [];
        const failed: string[] = [];

        for (const key in data) {
            const log = (...args: any[]) => {
                if (options?.log) console.log('[validate]', key, ...args);
            };

            const isValid = data[key];

            if (!body || body[key] === undefined) {
                passed = false;
                missing.push(key);
                continue;
            }

            // is it an array?
            if (Array.isArray(isValid)) {
                log('is array');
                // is it a primitive array?
                const isPrimitive = isValid.every((value) =>
                    ['string', 'number', 'boolean'].includes(
                        value as AllowedPrimitive,
                    )
                );
                // if not, it's just a normal array

                if (isPrimitive) {
                    log('is primitive array');
                    if (
                        !(isValid as AllowedPrimitive[]).includes(
                            typeof body[key] as AllowedPrimitive,
                        )
                    ) {
                        log('invalid primitive array');
                        // invalid, not a primitive
                        passed = false;
                        failed.push(key);
                        continue;
                    }
                } else {
                    log('is normal array');
                    if (isValid.includes(body[key] as never)) {
                        log('valid normal array');
                        // valid
                        continue;
                    } else {
                        log('invalid normal array');
                        // invalid
                        passed = false;
                        failed.push(key);
                        continue;
                    }
                }
            } else {
                log('is not array');
                // is it a primitive?
                const isPrimitive = ['string', 'number', 'boolean'].includes(
                    isValid as unknown as AllowedPrimitive,
                );

                if (isPrimitive) {
                    log('is primitive');
                    if (typeof body[key] !== isValid) {
                        log('invalid primitive');
                        // invalid, not a primitive
                        passed = false;
                        failed.push(key);
                        continue;
                    }
                } else {
                    log('is not primitive');
                    if ((isValid as (data: any) => boolean)(body[key])) {
                        log('valid non-primitive');
                        // valid
                        continue;
                    } else {
                        log('invalid non-primitive');
                        passed = false;
                        failed.push(key);
                        continue;
                    }
                }
            }
        }

        if (passed) return next();

        if (options?.onInvalid) {
            for (const key of failed) {
                options.onInvalid(key, body[key]);
            }
        }

        if (options?.onMissing) {
            for (const key of missing) {
                options.onMissing(key);
            }
        }

        return res.sendStatus('server:invalid-data', body);
    };
};
