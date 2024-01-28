import { attempt } from '../../shared/attempt';
import { log } from './logging';

/**
 * Creates a fullscreen request
 * @param _target Fullscreen target
 * @returns A function that exits fullscreen
 */
export const fullscreen = (_target: HTMLElement) => {
    const end = () =>
        attempt(() => {
            // exit fullscreen
            if (document.fullscreenElement) {
                document.exitFullscreen().then(() => log('Exited fullscreen'));
            }
        });

    end(); // exit current fullscreen

    attempt(() => {
        if (document['exitFullscreen']) {
            document['exitFullscreen']();
        } else if (document['webkitExitFullscreen']) {
            document['webkitExitFullscreen']();
        } else if (document['mozCancelFullScreen']) {
            document['mozCancelFullScreen']();
        } else if (document['msExitFullscreen']) {
            document['msExitFullscreen']();
        }
    });

    return end;
};
