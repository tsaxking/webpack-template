import { Color } from './color';
export class Gradient {
    colors: Color[];

    /**
     * Creates a a random gradient
     * @param frames The number of frames to fade between the colors
     * @returns {Gradient} Returns a new gradient with the colors faded between each other
     */
    static random(frames = 60): Gradient {
        return Color.random().linearFade(Color.random(), frames);
    }

    /**
     * Creates a gradient from a color to another color
     * @param gradients The gradients to combine
     * @returns {Gradient} Returns a new gradient with all the colors from the gradients
     */
    static combine(...gradients: Gradient[]): Gradient {
        const colors: Color[] = [];
        gradients.forEach(g => {
            colors.push(...g.colors);
        });

        return new Gradient(...colors);
    }

    constructor(...colors: Color[]) {
        this.colors = colors;
    }

    /**
     * @param deg The degree of the gradient (0-360)
     * @returns {string} Returns the gradient as a linear-gradient string
     */
    public toString(deg = 90): string {
        let gradient = `linear-gradient(${deg}deg`;
        this.colors.forEach(color => {
            gradient += `,${color.toString()}`;
        });
        gradient += ')';
        return gradient;
    }

    /**
     * View each color in the gradient
     */
    public view() {
        this.colors.forEach(c => c.view());
    }

    /**
     * Logs each character in the gradient to the console
     * @param string The string to log
     */
    public logText(string: string) {
        if (typeof string !== 'string') {
            throw new Error(
                'logText() expects a string, received ' + typeof string
            );
        }

        const { colors } = this;

        const gradientLength = colors.length;

        const gradient = string
            .split('')
            .map(char => {
                return `%c${char}`;
            })
            .join('');

        let gradientIndex = 0;
        let direction = 1;
        const gradientString = string.split('').map((_, i) => {
            if (direction === 1) {
                if (gradientIndex === gradientLength - 1) {
                    direction = -1;
                }
            } else {
                if (gradientIndex === 0) {
                    direction = 1;
                }
            }

            gradientIndex += direction;

            return `color: ${colors[gradientIndex].toString()}`;
        });

        console.log(gradient, ...gradientString);
    }

    /**
     * Adds colors to the gradient
     */
    public add(...gradients: Gradient[]) {
        gradients.forEach(g => {
            this.colors.push(...g.colors);
        });
    }

    /**
     * Randomizes the colors in the gradient
     * @returns {Gradient} Returns the current gradient
     */
    public random(): Gradient {
        this.colors.forEach(_ => Math.random() - 0.5);
        return this;
    }
}
