export type StatusCode = 
    100 | 101 | 102 | 103 |
    200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 |
    300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 |
    400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 
        418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 |
    500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;



export enum ServerCode {
    continue = 100,
    switchingProtocols = 101,
    processing = 102,
    earlyHints = 103,
    ok = 200,
    created = 201,
    accepted = 202,
    nonAuthoritativeInformation = 203,
    noContent = 204,
    resetContent = 205,
    partialContent = 206,
    multiStatus = 207,
    alreadyReported = 208,
    imUsed = 226,
    multipleChoices = 300,
    movedPermanently = 301,
    found = 302,
    seeOther = 303,
    notModified = 304,
    useProxy = 305,
    unused = 306,
    temporaryRedirect = 307,
    permanentRedirect = 308,
    badRequest = 400,
    unauthorized = 401,
    paymentRequired = 402,
    forbidden = 403,
    notFound = 404,
    methodNotAllowed = 405,
    notAcceptable = 406,
    proxyAuthenticationRequired = 407,
    requestTimeout = 408,
    conflict = 409,
    gone = 410,
    lengthRequired = 411,
    preconditionFailed = 412,
    payloadTooLarge = 413,
    uriTooLong = 414,
    unsupportedMediaType = 415,
    rangeNotSatisfiable = 416,
    expectationFailed = 417,
    imATeapot = 418,
    misdirectedRequest = 421,
    unprocessableEntity = 422,
    locked = 423,
    failedDependency = 424,
    tooEarly = 425,
    upgradeRequired = 426,
    preconditionRequired = 428,
    tooManyRequests = 429,
    requestHeaderFieldsTooLarge = 431,
    unavailableForLegalReasons = 451,
    internalServerError = 500,
    notImplemented = 501,
    badGateway = 502,
    serviceUnavailable = 503,
    gatewayTimeout = 504,
    httpVersionNotSupported = 505,
    variantAlsoNegotiates = 506,
    insufficientStorage = 507,
    loopDetected = 508,
    notExtended = 510,
    networkAuthenticationRequired = 511
}

export type StatusColor = 'success' | 'danger' | 'warning' | 'info';


export type StatusMessage = {
    message: string;
    color: StatusColor;
    code: StatusCode;
    instructions: string;
    redirect?: string;
}

export type StatusJson = StatusMessage & {
    title: string;
    status: string;
    data?: {
        [key: string]: any;
    }
}


export const messages: {
    [key: string]: StatusMessage;
} = {
    'account:created': {
        message: 'Your account has been created.',
        color: 'success',
        code: 200,
        instructions: 'You will be redirected to the login page',
        redirect: '/account/sign-in'
    },
    'account:username-taken': {
        message: 'That username is already taken.',
        color: 'danger',
        code: 400,
        instructions: 'Please try another username.'
    },
    'account:email-taken': {
        message: 'That email is already taken.',
        color: 'danger',
        code: 400,
        instructions: 'Please try another email.'
    },
    'account:invalid-email': {
        message: 'That email is invalid.',
        color: 'danger',
        code: 400,
        instructions: 'Please try another email.'
    },
    'account:invalid-password': {
        message: 'That password is invalid.',
        color: 'danger',
        code: 400,
        instructions: 'Please try another password.'
    },
    'account:invalid-username': {
        message: 'That username is invalid.',
        color: 'danger',
        code: 400,
        instructions: 'Please try another username.'
    },
    'account:incorrect-username-or-password': {
        message: 'Incorrect username or password.',
        color: 'danger',
        code: 400,
        instructions: 'Please try again.'
    },
    'account:password-mismatch': {
        message: 'Passwords do not match.',
        color: 'danger',
        code: 400,
        instructions: 'Please try again.'
    },
    'account:not-logged-in': {
        message: 'You are not logged in.',
        color: 'danger',
        code: 400,
        instructions: 'Please log in.'
    },
    'account:not-found': {
        message: 'Account not found.',
        color: 'danger',
        code: 400,
        instructions: 'Please try again.'
    },
    'account:logged-in': {
        message: 'You have been logged in.',
        color: 'success',
        code: 200,
        instructions: 'You will be redirected to the home page.',
        redirect: '/'
    },
    'account:logged-out': {
        message: 'You have been logged out.',
        color: 'success',
        code: 200,
        instructions: 'You will be redirected to the home page.',
        redirect: '/'
    },
    'account:server-error': {
        message: 'There was a server error.',
        color: 'danger',
        code: 500,
        instructions: 'Please try again.'
    },
    'account:already-logged-in': {
        message: 'You are already logged in.',
        color: 'danger',
        code: 400,
        instructions: 'Please log out.'
    },
    'account:invalid-password-reset-key': {
        message: 'Invalid password reset key.',
        color: 'danger',
        code: 400,
        instructions: 'Please try again.'
    },
    'account:removed': {
        message: 'Account has been removed.',
        color: 'success',
        code: 200,
        instructions: ''
    },
    'account:invalid-verification-key': {
        message: 'Invalid verification key.',
        color: 'danger',
        code: 400,
        instructions: 'Please try again.'
    },
    'account:verified': {
        message: 'Account has been verified.',
        color: 'success',
        code: 200,
        instructions: 'You will be redirected to the home page.',
        redirect: '/'
    },
    'account:password-reset-request': {
        message: 'Password reset request has been sent to your email',
        color: 'success',
        code: 200,
        instructions: 'Please follow the instructions in the email to reset your password.'
    },
    'account:updated': {
        message: 'Account has been updated.',
        color: 'success',
        code: 200,
        instructions: ''
    },










    'roles:added': {
        message: 'Role added',
        color: 'success',
        code: 200,
        instructions: ''
    },
    'roles:removed': {
        message: 'Role removed',
        color: 'success',
        code: 200,
        instructions: ''
    },
    'roles:not-found': {
        message: 'Role not found',
        color: 'danger',
        code: 400,
        instructions: ''
    },
    'roles:has-role': {
        message: 'User already has role',
        color: 'danger',
        code: 400,
        instructions: ''
    },
    'roles:invalid-role': {
        message: 'Invalid role',
        color: 'danger',
        code: 400,
        instructions: ''
    },
    'roles:does-not-have-role': {
        message: 'User does not have role',
        color: 'danger',
        code: 400,
        instructions: ''
    },







    'skills:added': {
        message: 'Skill added',
        color: 'success',
        code: 200,
        instructions: ''
    },
    'skills:removed': {
        message: 'Skill removed',
        color: 'success',
        code: 200,
        instructions: ''
    },
    'skills:not-found': {
        message: 'Skill not found',
        color: 'danger',
        code: 400,
        instructions: ''
    },
    'skills:has-skill': {
        message: 'User already has skill',
        color: 'danger',
        code: 400,
        instructions: ''
    },
    'skills:invalid-skill': {
        message: 'Invalid skill',
        color: 'danger',
        code: 400,
        instructions: ''
    },











    'admin:invalid-key': {
        message: 'Invalid key',
        color: 'danger',
        code: 400,
        instructions: ''
    },




    'page:not-found': {
        message: 'Page not found',
        color: 'danger',
        code: 404,
        instructions: 'This page was not found. Please check your link and try again.'
    },





    'permissions:invalid': {
        message: 'Invalid permissions',
        color: 'danger',
        code: 401,
        instructions: ''
    },
    'permissions:error': {
        message: 'Permissions error',
        color: 'danger',
        code: 401,
        instructions: ''
    },
    'permissions:forbidden': {
        message: 'Forbidden',
        color: 'danger',
        code: 403,
        instructions: ''
    },
    'permissions:unauthorized': {
        message: 'Unauthorized',
        color: 'danger',
        code: 401,
        instructions: ''
    },
        






    'unknown': {
        message: 'Unknown error',
        color: 'danger',
        code: 500,
        instructions: 'Please try again.'
    },






    'profanity': {
        message: 'Profanity detected',
        color: 'danger',
        code: 400,
        instructions: 'Please try again.'
    },
    'spam': {
        message: 'Spam detected',
        color: 'danger',
        code: 400,
        instructions: 'Please try again.'
    },





    'files:too-large': {
        message: 'File too large',
        color: 'danger',
        code: 400,
        instructions: 'Please try again.'
    },
    'files:invalid-extension': {
        message: 'Invalid file extension',
        color: 'danger',
        code: 400,
        instructions: 'Please try again.'
    },
    'files:invalid': {
        message: 'Invalid file',
        color: 'danger',
        code: 400,
        instructions: 'Please try again.'
    },
    'files:uploaded': {
        message: 'File uploaded',
        color: 'success',
        code: 200,
        instructions: ''
    },





    'member:not-member': {
        message: 'Not a member',
        color: 'danger',
        code: 400,
        instructions: 'Please try again.'
    },
    'member:not-found': {
        message: 'Member not found',
        color: 'danger',
        code: 400,
        instructions: 'Please try again.'
    },
    'member:requested-sent': {
        message: 'Request sent',
        color: 'success',
        code: 200,
        instructions: ''
    },
    'member:update-bio': {
        message: 'Bio updated',
        color: 'success',
        code: 200,
        instructions: ''
    },
    'member:update-title': {
        message: 'Title updated',
        color: 'success',
        code: 200,
        instructions: ''
    },
    'member:update-resume': {
        message: 'Resume updated',
        color: 'success',
        code: 200,
        instructions: ''
    },
    'member:add-skill': {
        message: 'Skill added',
        color: 'success',
        code: 200,
        instructions: ''
    },
    'member:remove-skill': {
        message: 'Skill removed',
        color: 'success',
        code: 200,
        instructions: ''
    },
    'member:cannot-manage': {
        message: 'Cannot manage member',
        color: 'danger',
        code: 400,
        instructions: ''
    },

    'not-found': {
        message: 'Not found',
        color: 'danger',
        code: 404,
        instructions: 'Please try again.'
    }
};






export type StatusId = 
    'account:created' |
    'account:username-taken' |
    'account:email-taken' |
    'account:invalid-email' |
    'account:invalid-password' |
    'account:invalid-username' |
    'account:incorrect-username-or-password' |
    'account:password-mismatch' |
    'account:not-logged-in' |
    'account:not-found' |
    'account:logged-in' |
    'account:logged-out' |
    'account:server-error' |
    'account:already-logged-in' |
    'account:invalid-password-reset-key' |
    'account:removed' |
    'account:invalid-verification-key' |
    'account:verified' |
    'account:password-reset-request' |

    'roles:added' |
    'roles:removed' |
    'roles:not-found' |
    'roles:has-role' |
    'roles:invalid-role' |
    'roles:does-not-have-role' |

    'skills:added' |
    'skills:removed' |
    'skills:not-found' |
    'skills:has-skill' |
    'skills:invalid-skill' |
    
    'admin:invalid-key' |

    'page:not-found' |

    'permissions:invalid' |
    'permissions:error' |
    'permissions:forbidden' |
    'permissions:unauthorized' |

    'unknown' |

    'profanity' |
    'spam' |

    'files:too-large' |
    'files:invalid-extension' |
    'files:invalid' |
    'files:uploaded' |

    'member:not-member' |
    'member:not-found' |
    'member:requested-sent' |
    'member:update-bio' |
    'member:update-title' |
    'member:update-resume' |
    'member:add-skill' |
    'member:remove-skill' |
    'member:cannot-manage' | 
    
    'not-found';