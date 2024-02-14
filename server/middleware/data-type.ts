/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from '../../shared/event-emitter.ts';
import { ServerFunction } from '../structure/app/app.ts';
import { Req } from '../structure/app/req.ts';

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

export const emitter = (() => {
    type Updates = {
        fail: [string, unknown, IsValid]; // key, value, desired
    };

    type Reason =
        | 'invalid-primitive-array'
        | 'invalid-normal-array'
        | 'invalid-non-primitive'
        | 'invalid-primitive'
        | 'missing-key';

    class DataValidationFaliure<T extends keyof Updates> {
        constructor(
            public readonly type: T,
            public readonly data: Updates[T],
            public readonly url: string,
            public readonly method: string,
            public readonly reason: Reason,
        ) {}
    }

    class EM {
        private readonly emitter = new EventEmitter<keyof Updates>();

        on<K extends keyof Updates>(
            event: K,
            callback: (data: DataValidationFaliure<K>) => void,
        ): void {
            this.emitter.on(event, callback);
        }

        off<K extends keyof Updates>(
            event: K,
            callback?: (data: DataValidationFaliure<K>) => void,
        ): void {
            this.emitter.off(event, callback);
        }

        emit<K extends keyof Updates>(
            event: K,
            data: Updates[K],
            req: Req,
            reason: Reason,
        ): void {
            const e = new DataValidationFaliure(
                event,
                data,
                req.url,
                req.method,
                reason,
            );
            this.emitter.emit(event, e);
        }
    }

    return new EM();
})();

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
        let { body } = req;

        // body can be stored here because it could be a file stream
        if (!Object.entries(body as any).length) {
            body = JSON.parse(req.headers.get('X-Body') || '{}');
        }

        let passed = true;
        const missing: string[] = [];
        const failed: string[] = [];

        for (const [key, isValid] of Object.entries(data)) {
            const log = (...args: any[]) => {
                if (options?.log) console.log('[validate]', key, ...args);
            };

            if (!body || body[key] === undefined) {
                passed = false;
                missing.push(key);
                emitter.emit(
                    'fail',
                    [key, body[key], isValid as IsValid],
                    req,
                    'missing-key',
                );
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
                        emitter.emit(
                            'fail',
                            [key, body[key], isValid],
                            req,
                            'invalid-primitive-array',
                        );
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
                        emitter.emit(
                            'fail',
                            [key, body[key], isValid],
                            req,
                            'invalid-normal-array',
                        );
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
                        emitter.emit(
                            'fail',
                            [key, body[key], isValid as IsValid],
                            req,
                            'invalid-primitive',
                        );
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
                        emitter.emit(
                            'fail',
                            [key, body[key], isValid as IsValid],
                            req,
                            'invalid-non-primitive',
                        );
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
