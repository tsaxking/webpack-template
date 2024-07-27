import { Settings } from '../models/settings';
Settings.init();

// manage how settings affect the app here
Settings.on('set', ([key, value]) => {
    // switch (key) {
    // }
});
