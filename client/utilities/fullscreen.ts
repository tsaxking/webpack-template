import { attempt } from '../../shared/check';
import { log } from './logging';

/**
 * Creates a fullscreen request
 * @param _target Fullscreen target
 * @returns A function that exits fullscreen
 */
export const fullscreen = (_target?: HTMLElement) => {
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
        } else if (
            Object.prototype.hasOwnProperty.call(
                document,
                'webkitExitFullscreen'
            )
        ) {
            Object.getOwnPropertyDescriptor(
                document,
                'webkitExitFullscreen'
            )?.value?.call(document);
        } else if (
            Object.prototype.hasOwnProperty.call(
                document,
                'mozCancelFullScreen'
            )
        ) {
            Object.getOwnPropertyDescriptor(
                document,
                'mozCancelFullScreen'
            )?.value?.call(document);
        } else if (
            Object.prototype.hasOwnProperty.call(document, 'msExitFullscreen')
        ) {
            Object.getOwnPropertyDescriptor(
                document,
                'msExitFullscreen'
            )?.value?.call(document);
        }
    });

    return end;
};
