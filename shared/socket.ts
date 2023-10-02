export type SocketEvent = 
    // aligned with status messages
    'account:created' |
    'account:logged-in' |
    'account:logged-out' |
    'account:removed' |
    'account:verified' |
    'account:unverified' |
    'account:update-username' |
    'account:update-email' |
    'account:update-first-name' |
    'account:update-last-name' |
    'account:update-picture' |
    'account:update-phone-number' |
    'account:unverified' |

    'roles:added' |
    'roles:removed' |

    'skills:added' |
    'skills:removed' |

    'member:request' |
    'member:update-bio' |
    'member:update-title' |
    'member:update-resume' |
    'member:add-skill' |
    'member:remove-skill' |
    
    
    
    // client only
    'page:open' | 
    'disconnect';
