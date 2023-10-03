
export type StatusColor = 'success' | 'danger' | 'warning' | 'info';
export type StatusCode = 
    100 | 101 | 102 | 103 |
    200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226 |
    300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308 |
    400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 
        418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451 |
    500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;
export type StatusMessage = {
    message: string;
    color: StatusColor;
    code: StatusCode;
    instructions: string;
    redirect?: string;
}



export const messages: {
    [key in StatusId]: StatusMessage;
} = {
    'account:already-logged-in': {
    message: 'You are already logged in.',
    color: 'danger',
    code: 400,
    instructions: 'Please log out.'
},
    'account:cannot-edit-self': {
    message: 'You cannot edit this part of your account presently',
    color: 'danger',
    code: 403,
    instructions: ''
},
    'account:cannot-reject-verified': {
    message: 'You cannot reject a verified account',
    color: 'danger',
    code: 403,
    instructions: ''
},
    'account:created': {
    message: 'Your account has been created.',
    color: 'success',
    code: 200,
    instructions: 'You will be redirected to the login page'
},
    'account:email-taken': {
    message: 'That email is already taken.',
    color: 'danger',
    code: 400,
    instructions: 'Please try another email.'
},
    'account:incorrect-username-or-password': {
    message: 'Incorrect username or password.',
    color: 'danger',
    code: 400,
    instructions: 'Please try again.'
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
    'account:invalid-password-reset-key': {
    message: 'Invalid password reset key.',
    color: 'danger',
    code: 400,
    instructions: 'Please try again.'
},
    'account:invalid-username': {
    message: 'That username is invalid.',
    color: 'danger',
    code: 400,
    instructions: 'Please try another username.'
},
    'account:invalid-verification-key': {
    message: 'Invalid verification key.',
    color: 'danger',
    code: 400,
    instructions: 'Please try again.'
},
    'account:logged-in': {
    message: 'You have been logged in.',
    color: 'success',
    code: 200,
    instructions: 'You will be redirected to the home page.'
},
    'account:logged-out': {
    message: 'You have been logged out.',
    color: 'success',
    code: 200,
    instructions: 'You will be redirected to the home page.'
},
    'account:not-found': {
    message: 'Account not found.',
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
    'account:not-verified': {
    message: 'Account is not verified',
    color: 'danger',
    code: 403,
    instructions: 'Please wait for your account to be verified'
},
    'account:password-mismatch': {
    message: 'Passwords do not match.',
    color: 'danger',
    code: 400,
    instructions: 'Please try again.'
},
    'account:password-reset-request': {
    message: 'Password reset request has been sent to your email',
    color: 'success',
    code: 200,
    instructions: 'Please follow the instructions in the email to reset your password.'
},
    'account:removed': {
    message: 'Account has been removed.',
    color: 'success',
    code: 200,
    instructions: ''
},
    'account:server-error': {
    message: 'There was a server error.',
    color: 'danger',
    code: 500,
    instructions: 'Please try again.'
},
    'account:unverified': {
    message: 'Account has been unverified',
    color: 'success',
    code: 200,
    instructions: ''
},
    'account:updated': {
    message: 'Account has been updated.',
    color: 'success',
    code: 200,
    instructions: ''
},
    'account:username-taken': {
    message: 'That username is already taken.',
    color: 'danger',
    code: 400,
    instructions: 'Please try another username.'
},
    'account:verified': {
    message: 'Account has been verified.',
    color: 'success',
    code: 200,
    instructions: 'You will be redirected to the home page.'
},
    'admin:invalid-key': {
    message: 'Invalid key',
    color: 'danger',
    code: 400,
    instructions: ''
},
    'files:invalid': {
    message: 'Invalid file',
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
    'files:too-large': {
    message: 'File too large',
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
    'member:add-skill': {
    message: 'Skill added',
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
    'member:not-found': {
    message: 'Member not found',
    color: 'danger',
    code: 400,
    instructions: 'Please try again.'
},
    'member:not-member': {
    message: 'Not a member',
    color: 'danger',
    code: 400,
    instructions: 'Please try again.'
},
    'member:remove-skill': {
    message: 'Skill removed',
    color: 'success',
    code: 200,
    instructions: ''
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
    'member:update-resume': {
    message: 'Resume updated',
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
    'not-found': {
    message: 'Not found',
    color: 'danger',
    code: 404,
    instructions: 'Please try again.'
},
    'page:not-found': {
    message: 'Page not found',
    color: 'danger',
    code: 404,
    instructions: 'This page was not found. Please check your link and try again.'
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
    'permissions:invalid': {
    message: 'Invalid permissions',
    color: 'danger',
    code: 401,
    instructions: ''
},
    'permissions:unauthorized': {
    message: 'Unauthorized',
    color: 'danger',
    code: 401,
    instructions: ''
},
    'profanity': {
    message: 'Profanity detected',
    color: 'danger',
    code: 400,
    instructions: 'Please try again.'
},
    'roles:added': {
    message: 'Role added',
    color: 'success',
    code: 200,
    instructions: ''
},
    'roles:does-not-have-role': {
    message: 'User does not have role',
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
    'roles:not-found': {
    message: 'Role not found',
    color: 'danger',
    code: 400,
    instructions: ''
},
    'roles:removed': {
    message: 'Role removed',
    color: 'success',
    code: 200,
    instructions: ''
},
    'skills:added': {
    message: 'Skill added',
    color: 'success',
    code: 200,
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
    'skills:not-found': {
    message: 'Skill not found',
    color: 'danger',
    code: 400,
    instructions: ''
},
    'skills:removed': {
    message: 'Skill removed',
    color: 'success',
    code: 200,
    instructions: ''
},
    'spam': {
    message: 'Spam detected',
    color: 'danger',
    code: 400,
    instructions: 'Please try again.'
},
    'unknown': {
    message: 'Unknown error',
    color: 'danger',
    code: 500,
    instructions: 'Please try again.'
}
};

export type StatusId = 'account:already-logged-in'
	| 'account:cannot-edit-self'
	| 'account:cannot-reject-verified'
	| 'account:created'
	| 'account:email-taken'
	| 'account:incorrect-username-or-password'
	| 'account:invalid-email'
	| 'account:invalid-password'
	| 'account:invalid-password-reset-key'
	| 'account:invalid-username'
	| 'account:invalid-verification-key'
	| 'account:logged-in'
	| 'account:logged-out'
	| 'account:not-found'
	| 'account:not-logged-in'
	| 'account:not-verified'
	| 'account:password-mismatch'
	| 'account:password-reset-request'
	| 'account:removed'
	| 'account:server-error'
	| 'account:unverified'
	| 'account:updated'
	| 'account:username-taken'
	| 'account:verified'
	| 'admin:invalid-key'
	| 'files:invalid'
	| 'files:invalid-extension'
	| 'files:too-large'
	| 'files:uploaded'
	| 'member:add-skill'
	| 'member:cannot-manage'
	| 'member:not-found'
	| 'member:not-member'
	| 'member:remove-skill'
	| 'member:requested-sent'
	| 'member:update-bio'
	| 'member:update-resume'
	| 'member:update-title'
	| 'not-found'
	| 'page:not-found'
	| 'permissions:error'
	| 'permissions:forbidden'
	| 'permissions:invalid'
	| 'permissions:unauthorized'
	| 'profanity'
	| 'roles:added'
	| 'roles:does-not-have-role'
	| 'roles:has-role'
	| 'roles:invalid-role'
	| 'roles:not-found'
	| 'roles:removed'
	| 'skills:added'
	| 'skills:has-skill'
	| 'skills:invalid-skill'
	| 'skills:not-found'
	| 'skills:removed'
	| 'spam'
	| 'unknown'
;