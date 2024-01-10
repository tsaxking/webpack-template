import { attempt } from '../../shared/attempt';

/**
 * Creates a fullscreen request
 * @param target Fullscreen target
 * @returns A function that exits fullscreen
 */
export const fullscreen = (target: HTMLElement) => {
    const end = () =>
        attempt(() => {
            // exit fullscreen
            if (document.fullscreenElement) {
                document.exitFullscreen()
                    .then(() => console.log('Exited fullscreen'));
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
