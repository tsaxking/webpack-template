import { Settings } from '../models/settings';
Settings.init();

// manage how settings affect the app here
Settings.on('set', ([key, value]) => {
    switch (key) {
        case 'theme':
            if (typeof value !== 'string') break;
            document.documentElement.setAttribute(
                'data-bs-theme',
                String(value).toLowerCase()
            );
            break;
    }
});
