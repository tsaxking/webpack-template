import { Gradient } from './gradient';

const colors = {
    aliceblue: [240, 248, 255, 1],
    antiquewhite: [250, 235, 215, 1],
    aqua: [0, 255, 255, 1],
    aquamarine: [127, 255, 212, 1],
    azure: [240, 255, 255, 1],
    beige: [245, 245, 220, 1],
    bisque: [255, 228, 196, 1],
    black: [0, 0, 0, 1],
    blanchedalmond: [255, 235, 205, 1],
    blue: [0, 0, 255, 1],
    blueviolet: [138, 43, 226, 1],
    brown: [165, 42, 42, 1],
    burlywood: [222, 184, 135, 1],
    cadetblue: [95, 158, 160, 1],
    chartreuse: [127, 255, 0, 1],
    chocolate: [210, 105, 30, 1],
    coral: [255, 127, 80, 1],
    cornflowerblue: [100, 149, 237, 1],
    cornsilk: [255, 248, 220, 1],
    crimson: [220, 20, 60, 1],
    cyan: [0, 255, 255, 1],
    darkblue: [0, 0, 139, 1],
    darkcyan: [0, 139, 139, 1],
    darkgoldenrod: [184, 134, 11, 1],
    darkgray: [169, 169, 169, 1],
    darkgreen: [0, 100, 0, 1],
    darkgrey: [169, 169, 169, 1],
    darkkhaki: [189, 183, 107, 1],
    darkmagenta: [139, 0, 139, 1],
    darkolivegreen: [85, 107, 47, 1],
    darkorange: [255, 140, 0, 1],
    darkorchid: [153, 50, 204, 1],
    darkred: [139, 0, 0, 1],
    darksalmon: [233, 150, 122, 1],
    darkseagreen: [143, 188, 143, 1],
    darkslateblue: [72, 61, 139, 1],
    darkslategray: [47, 79, 79, 1],
    darkslategrey: [47, 79, 79, 1],
    darkturquoise: [0, 206, 209, 1],
    darkviolet: [148, 0, 211, 1],
    deeppink: [255, 20, 147, 1],
    deepskyblue: [0, 191, 255, 1],
    dimgray: [105, 105, 105, 1],
    dimgrey: [105, 105, 105, 1],
    dodgerblue: [30, 144, 255, 1],
    firebrick: [178, 34, 34, 1],
    floralwhite: [255, 250, 240, 1],
    forestgreen: [34, 139, 34, 1],
    fuchsia: [255, 0, 255, 1],
    gainsboro: [220, 220, 220, 1],
    ghostwhite: [248, 248, 255, 1],
    gold: [255, 215, 0, 1],
    goldenrod: [218, 165, 32, 1],
    gray: [128, 128, 128, 1],
    green: [0, 128, 0, 1],
    greenyellow: [173, 255, 47, 1],
    grey: [128, 128, 128, 1],
    honeydew: [240, 255, 240, 1],
    hotpink: [255, 105, 180, 1],
    indianred: [205, 92, 92, 1],
    indigo: [75, 0, 130, 1],
    ivory: [255, 255, 240, 1],
    khaki: [240, 230, 140, 1],
    lavender: [230, 230, 250, 1],
    lavenderblush: [255, 240, 245, 1],
    lawngreen: [124, 252, 0, 1],
    lemonchiffon: [255, 250, 205, 1],
    lightblue: [173, 216, 230, 1],
    lightcoral: [240, 128, 128, 1],
    lightcyan: [224, 255, 255, 1],
    lightgoldenrodyellow: [250, 250, 210, 1],
    lightgray: [211, 211, 211, 1],
    lightgreen: [144, 238, 144, 1],
    lightgrey: [211, 211, 211, 1],
    lightpink: [255, 182, 193, 1],
    lightsalmon: [255, 160, 122, 1],
    lightseagreen: [32, 178, 170, 1],
    lightskyblue: [135, 206, 250, 1],
    lightslategray: [119, 136, 153, 1],
    lightslategrey: [119, 136, 153, 1],
    lightsteelblue: [176, 196, 222, 1],
    lightyellow: [255, 255, 224, 1],
    lime: [0, 255, 0, 1],
    limegreen: [50, 205, 50, 1],
    linen: [250, 240, 230, 1],
    magenta: [255, 0, 255, 1],
    maroon: [128, 0, 0, 1],
    mediumaquamarine: [102, 205, 170, 1],
    mediumblue: [0, 0, 205, 1],
    mediumorchid: [186, 85, 211, 1],
    mediumpurple: [147, 112, 219, 1],
    mediumseagreen: [60, 179, 113, 1],
    mediumslateblue: [123, 104, 238, 1],
    mediumspringgreen: [0, 250, 154, 1],
    mediumturquoise: [72, 209, 204, 1],
    mediumvioletred: [199, 21, 133, 1],
    midnightblue: [25, 25, 112, 1],
    mintcream: [245, 255, 250, 1],
    mistyrose: [255, 228, 225, 1],
    moccasin: [255, 228, 181, 1],
    navajowhite: [255, 222, 173, 1],
    navy: [0, 0, 128, 1],
    oldlace: [253, 245, 230, 1],
    olive: [128, 128, 0, 1],
    olivedrab: [107, 142, 35, 1],
    orange: [255, 165, 0, 1],
    orangered: [255, 69, 0, 1],
    orchid: [218, 112, 214, 1],
    palegoldenrod: [238, 232, 170, 1],
    palegreen: [152, 251, 152, 1],
    paleturquoise: [175, 238, 238, 1],
    palevioletred: [219, 112, 147, 1],
    papayawhip: [255, 239, 213, 1],
    peachpuff: [255, 218, 185, 1],
    peru: [205, 133, 63, 1],
    pink: [255, 192, 203, 1],
    plum: [221, 160, 221, 1],
    powderblue: [176, 224, 230, 1],
    purple: [128, 0, 128, 1],
    red: [255, 0, 0, 1],
    rosybrown: [188, 143, 143, 1],
    royalblue: [65, 105, 225, 1],
    saddlebrown: [139, 69, 19, 1],
    salmon: [250, 128, 114, 1],
    sandybrown: [244, 164, 96, 1],
    seagreen: [46, 139, 87, 1],
    seashell: [255, 245, 238, 1],
    sienna: [160, 82, 45, 1],
    silver: [192, 192, 192, 1],
    skyblue: [135, 206, 235, 1],
    slateblue: [106, 90, 205, 1],
    slategray: [112, 128, 144, 1],
    slategrey: [112, 128, 144, 1],
    snow: [255, 250, 250, 1],
    springgreen: [0, 255, 127, 1],
    steelblue: [70, 130, 180, 1],
    tan: [210, 180, 140, 1],
    teal: [0, 128, 128, 1],
    thistle: [216, 191, 216, 1],
    tomato: [255, 99, 71, 1],
    transparent: [0, 0, 0, 0],
    turquoise: [64, 224, 208, 1],
    violet: [238, 130, 238, 1],
    wheat: [245, 222, 179, 1],
    white: [255, 255, 255, 1],
    whitesmoke: [245, 245, 245, 1],
    yellow: [255, 255, 0, 1],
    yellowgreen: [154, 205, 50, 1],
    rebeccapurple: [102, 51, 153, 1]
};

export type ColorStr = keyof typeof colors;

const BootstrapColors = {
    blue: [13, 110, 253],
    indigo: [102, 16, 242],
    purple: [111, 66, 193],
    pink: [214, 51, 132],
    red: [220, 53, 69],
    orange: [253, 126, 20],
    yellow: [255, 193, 7],
    green: [25, 135, 84],
    teal: [32, 201, 151],
    cyan: [13, 202, 240],
    black: [0, 0, 0],
    white: [240, 240, 240],
    gray: [108, 117, 125],
    grayDark: [52, 58, 64],
    gray100: [248, 249, 250],
    gray200: [233, 236, 239],
    gray300: [222, 226, 230],
    gray400: [206, 212, 218],
    gray500: [173, 181, 189],
    gray600: [108, 117, 125],
    gray700: [73, 80, 87],
    gray800: [52, 58, 64],
    gray900: [33, 37, 41],
    primary: [13, 110, 253],
    secondary: [108, 117, 125],
    success: [25, 135, 84],
    info: [13, 202, 240],
    warning: [255, 193, 7],
    danger: [220, 53, 69],
    light: [248, 249, 250],
    dark: [33, 37, 41],
    'primaryText-Emphasis': [5, 44, 101],
    'secondaryText-Emphasis': [43, 47, 50],
    'successText-Emphasis': [10, 54, 34],
    'infoText-Emphasis': [5, 81, 96],
    'warningText-Emphasis': [102, 77, 3],
    'dangerText-Emphasis': [88, 21, 28],
    'lightText-Emphasis': [73, 80, 87],
    'darkText-Emphasis': [73, 80, 87],
    'primaryBg-Subtle': [207, 226, 255],
    'secondaryBg-Subtle': [226, 227, 229],
    'successBg-Subtle': [209, 231, 221],
    'infoBg-Subtle': [207, 244, 252],
    'warningBg-Subtle': [255, 243, 205],
    'dangerBg-Subtle': [248, 215, 218],
    'lightBg-Subtle': [252, 252, 253],
    'darkBg-Subtle': [206, 212, 218],
    'primaryBorder-Subtle': [158, 197, 254],
    'secondaryBorder-Subtle': [196, 200, 203],
    'successBorder-Subtle': [163, 207, 187],
    'infoBorder-Subtle': [158, 234, 249],
    'warningBorder-Subtle': [255, 230, 156],
    'dangerBorder-Subtle': [241, 174, 181],
    'lightBorder-Subtle': [233, 236, 239],
    'darkBorder-Subtle': [173, 181, 189],
    bodyColor: [33, 37, 41],
    bodyBg: [240, 240, 240],
    emphasisColor: [0, 0, 0],
    secondaryBg: [233, 236, 239],
    tertiaryBg: [248, 249, 250],
    linkColor: [13, 110, 253],
    'linkHover-Color': [10, 88, 202],
    codeColor: [214, 51, 132],
    highlightColor: [33, 37, 41],
    highlightBg: [255, 243, 205],
    borderColor: [222, 226, 230],
    'formValid-Color': [25, 135, 84],
    'formValid-Border-Color': [25, 135, 84],
    'formInvalid-Color': [220, 53, 69],
    'formInvalid-Border-Color': [220, 53, 69],
    // colors-extended.css
    // "indigo": Color.fromHex('#4b0082').rgba.values,
    'indigo-light': [202, 128, 255, 1],
    // "indigo-light": Color.fromHex('#ca80ff').rgba.values,
    'indigo-dark': [25, 0, 51, 1],
    // "indigo-dark": Color.fromHex('#1e0033').rgba.values,

    // "teal": Color.fromHex('#1fc794').rgba.values,
    'teal-light': [233, 252, 246, 1],
    // "teal-light": Color.fromHex('#e9fcf6').rgba.values,
    'teal-dark': [0, 51, 51, 1],
    // "teal-dark": Color.fromHex('#158463').rgba.values,

    // "orange": Color.fromHex('#ff6600').rgba.values,
    'orange-light': [255, 209, 179, 1],
    // "orange-light": Color.fromHex('#ffd1b3').rgba.values,
    'orange-dark': [204, 102, 0, 1],
    // "orange-dark": Color.fromHex('#b34700').rgba.values,

    // "pink": Color.fromHex('#ff33cc').rgba.values,
    'pink-light': [255, 204, 242, 1],
    // "pink-light": Color.fromHex('#ffccf2').rgba.values,
    'pink-dark': [204, 0, 153, 1],
    // "pink-dark": Color.fromHex('#e600ac').rgba.values,

    // "maroon": Color.fromHex('#800000').rgba.values,
    'purple-light': [255, 204, 255, 1],
    // "maroon-light": Color.fromHex('#ff8080').rgba.values,
    'purple-dark': [51, 0, 51, 1],
    // "maroon-dark": Color.fromHex('#330000').rgba.values,

    // "navy": Color.fromHex('#000066').rgba.values,
    'navy-light': [204, 204, 255, 1],
    // "navy-light": Color.fromHex('#6666ff').rgba.values,
    'navy-dark': [0, 0, 51, 1],
    // "navy-dark": Color.fromHex('#00001a').rgba.values,

    // "yellow": Color.fromHex('#ffff00').rgba.values,
    'yellow-light': [255, 255, 179, 1],
    // "yellow-light": Color.fromHex('#ffffb3').rgba.values,
    'yellow-dark': [204, 204, 0, 1],
    // "yellow-dark": Color.fromHex('#b3b300').rgba.values,

    lime: [0, 255, 0, 1],
    // "lime": Color.fromHex('#00ff00').rgba.values,
    'lime-light': [179, 255, 179, 1],
    // "lime-light": Color.fromHex('#b3ffb3').rgba.values,
    'lime-dark': [0, 153, 0, 1],
    // "lime-dark": Color.fromHex('#00b300').rgba.values,

    // "gray": Color.fromHex('#808080').rgba.values,
    'gray-light': [230, 230, 230, 1],
    // "gray-light": Color.fromHex('#e6e6e6').rgba.values,
    'gray-dark': [51, 51, 51, 1],
    // "gray-dark": Color.fromHex('#595959').rgba.values,

    brown: [153, 51, 0, 1],
    // "brown": Color.fromHex('#993300').rgba.values,
    'brown-light': [255, 187, 153, 1],
    // "brown-light": Color.fromHex('#ffbb99').rgba.values,
    'brown-dark': [102, 0, 0, 1],
    // "brown-dark": Color.fromHex('#4d1a00').rgba.values,

    grape: [153, 0, 153, 1],
    // "grape": Color.fromHex('#b9135b').rgba.values,
    'grape-light': [255, 204, 255, 1],
    // "grape-light": Color.fromHex('#f5a3c6').rgba.values,
    'grape-dark': [102, 0, 102, 1],
    // "grape-dark": Color.fromHex('#730c39').rgba.values,

    vermillion: [227, 66, 52, 1],
    // "vermillion": Color.fromHex('#e34234').rgba.values,
    'vermillion-light': [255, 204, 204, 1],
    // "vermillion-light": Color.fromHex('#f6c1bc').rgba.values,
    'vermillion-dark': [179, 0, 0, 1],
    // "vermillion-dark": Color.fromHex('#b42518').rgba.values,

    steel: [103, 103, 153, 1],
    // "steel": Color.fromHex('#878f99').rgba.values,
    'steel-light': [204, 204, 255, 1],
    // "steel-light": Color.fromHex('#a2b9bc').rgba.values,
    'steel-dark': [51, 51, 102, 1],
    // "steel-dark": Color.fromHex('#6b5b95').rgba.values,

    // "green": Color.fromHex('#006600').rgba.values,
    'green-light': [179, 255, 179, 1],
    // "green-light": Color.fromHex('#66ff66').rgba.values,
    'green-dark': [0, 51, 0, 1]
    // "green-dark": Color.fromHex('#003300').rgba.values
};

export type BootstrapColor = keyof typeof BootstrapColors;
export type colorArray = [number, number, number, number];

export type colors = {
    [key: string]: colorArray;
};

export type ClosestColor = {
    name: string;
    distance: number;
    color: Color;
};

export class Color {
    static parse(color: string | ColorStr | BootstrapColor): Color {
        // receives a css color string and returns a Color object
        // if the string is not a valid color, returns a Color object with the default color

        const bs = Color.fromBootstrap(color as BootstrapColor);
        if (bs) return bs;
        const cl = Color.fromName(color as ColorStr);
        if (cl) return cl;

        // remove spaces
        color = color.replace(/\s/g, '');

        // hex
        if (color[0] === '#') return Color.fromHex(color);
        else {
            // get numbers between parentheses
            const parsed = color.match(/\(([^)]+)\)/);

            // error parsing
            if (!parsed) return new Color('rgb(0,0,0)');

            const colors: number[] = parsed[1]
                .split(',')
                .map(n => parseInt(n, 10));

            switch (color.split('(')[0]) {
                case 'rgb':
                    return Color.fromRGB(
                        colors[0],
                        colors[1],
                        colors[2],
                        colors[3]
                    );
                case 'hsl':
                    return Color.fromHSL(
                        colors[0],
                        colors[1],
                        colors[2],
                        colors[3]
                    );
                default:
                    return new Color('rgb(0,0,0)');
            }
        }
    }

    static fromHex(hex: string): Color {
        if (hex.length === 4) {
            const [r, g, b] = hex
                .slice(1)
                .split('')
                .map(n => parseInt(n, 16));

            return new Color(r * 16, g * 16, b * 16);
        }

        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        let a = parseInt(hex.slice(7, 9), 16) / 255;
        if (isNaN(a)) a = 1;

        return new Color(r, g, b, a);
    }

    static fromRGB(r: number, g: number, b: number, a?: number): Color {
        return new Color(r, g, b, a);
    }

    static fromHSL(h: number, s: number, l: number, a?: number): Color {
        const params = ['hue', 'saturation', 'lightness'];
        [h, s, l].forEach((v, i) => {
            if (isNaN(v)) {
                throw new Error(
                    `Invalid ${params[i]}, ${v} is not a parsable number`
                );
            }

            if (v > 1) {
                console.warn(
                    `Invalid ${params[i]}, ${v} is greater than 1. It will be set to 1`
                );
                v = 1;
            }

            if (v < 0) {
                console.warn(
                    `Invalid ${params[i]}, ${v} is less than 0. It will be set to 0`
                );
                v = 0;
            }
        });

        let r, g, b;

        if (s == 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return new Color(r * 255, g * 255, b * 255, a);
    }

    static random(): Color {
        return new Color(
            Math.random() * 255,
            Math.random() * 255,
            Math.random() * 255
        );
    }

    static fromName<T extends ColorStr>(name: T): Color;
    static fromName(name: ColorStr): Color | undefined {
        const c = Color.colors[name];

        if (c) return new Color(...c);
    }

    static fromBootstrap<T extends BootstrapColor>(name: T): Color;
    static fromBootstrap(name: BootstrapColor): Color | undefined {
        const c = Color.bootstrap[name];

        if (c) return new Color(...c);
    }

    static generateRandomWithContrast(...colors: Color[]): Color {
        type interval = {
            diff: number;
            hues: number[];
        };

        const hsls: number[] = colors.map(c => c.hsl.values[0]);

        const intervals = hsls.reduce((intervals, hue, i): interval[] => {
            const next = hsls[i + 1];
            if (next) {
                intervals.push({
                    diff: Math.abs(hue - next),
                    hues: [hue, next]
                });
            }

            return intervals;
        }, [] as interval[]);

        const max = Math.max(...intervals.map(i => i.diff));
        let int = intervals.find(i => i.diff === max);
        int = int || intervals[0];

        const [hue1, hue2] = int.hues;
        const hue = Math.random() * (hue2 - hue1) + hue1;

        const color = Color.fromHSL(hue, 0.5, 0.5);
        return color;
    }

    /**
     * All colors and their RGB values
     */
    static get colors(): {
        [key in ColorStr]: colorArray;
    } {
        return colors as {
            [key in ColorStr]: colorArray;
        };
    }

    /**
     * Get the bootstrap colors
     */
    static get bootstrap(): {
        [key in BootstrapColor]: colorArray;
    } {
        return BootstrapColors as {
            [key in BootstrapColor]: colorArray;
        };
    }

    /**
     * @returns {Object} The closest color name and its distance
     * @property {string} name The name of the closest color
     * @property {number} distance The distance between the colors
     * @property {Color} color The closest color
     */
    get closestName(): ClosestColor {
        const { colors } = Color;
        const [r, g, b] = this.rgb.values;

        return Object.entries(colors).reduce(
            (closest, [name, rgb]) => {
                const [r2, g2, b2] = rgb;
                const distance = Math.sqrt(
                    Math.pow(r - r2, 2) +
                        Math.pow(g - g2, 2) +
                        Math.pow(b - b2, 2)
                );

                if (distance < closest.distance) {
                    return {
                        name,
                        distance,
                        color: new Color(r2, g2, b2)
                    };
                }

                return closest;
            },
            {
                name: '',
                distance: Infinity,
                color: new Color(0, 0, 0)
            } as ClosestColor
        );
    }

    /**
     * @returns {Object} The closest bootstrap color and its distance
     */
    get closestBootstrap(): ClosestColor {
        const { bootstrap } = Color;
        const [r, g, b] = this.rgb.values;

        return Object.entries(bootstrap).reduce(
            (closest, [name, rgb]) => {
                const [r2, g2, b2] = rgb;
                const distance = Math.sqrt(
                    Math.pow(r - r2, 2) +
                        Math.pow(g - g2, 2) +
                        Math.pow(b - b2, 2)
                );

                if (distance < closest.distance) {
                    return {
                        name,
                        distance,
                        color: new Color(r2, g2, b2)
                    };
                }

                return closest;
            },
            {
                name: '',
                distance: Infinity,
                color: new Color(0, 0, 0)
            } as ClosestColor
        );
    }

    r: number;
    g: number;
    b: number;
    a: number;

    /**
     * @returns {Color} A copy of this color with no dependencies
     */
    public clone(): Color {
        return new Color(this.r, this.g, this.b, this.a);
    }

    constructor(
        redOrString: number | string | ColorStr | BootstrapColor,
        green?: number,
        blue?: number,
        alpha?: number
    ) {
        if (typeof redOrString === 'string') {
            if (
                green !== undefined ||
                blue !== undefined ||
                alpha !== undefined
            ) {
                throw new Error(
                    'Invalid arguments. If the first argument is a string, the other arguments must be undefined.'
                );
            }

            const c = Color.parse(redOrString);

            this.r = c.r;
            this.g = c.g;
            this.b = c.b;
            this.a = c.a;
        } else {
            let allowed = false;

            const check: string[] = ['red', 'green', 'blue', 'alpha'];

            [redOrString, green, blue, alpha].forEach((value, index) => {
                if (value === undefined) return;
                if (isNaN(value)) {
                    throw new Error(
                        `Invalid ${check[index]}, ${value} is not a parsable number`
                    );
                }

                if (value > 255) {
                    console.warn(
                        `Invalid ${check[index]}, ${value} is greater than 255. It will be set to 255`
                    );
                    value = 255;
                }

                if (value < 0) {
                    console.warn(
                        `Invalid ${check[index]}, ${value} is less than 0. It will be set to 0`
                    );
                    value = 0;
                }

                allowed = true;
            });

            alpha = alpha || 1;

            this.r = redOrString;
            this.g = green || 0;
            this.b = blue || 0;
            this.a = alpha;
        }
    }

    get rgb() {
        return {
            values: [this.r, this.g, this.b],
            toString: () => `rgb(${this.r}, ${this.g}, ${this.b})`,
            setRed: (value: number) => {
                this.r = value;
                return this;
            },
            setGreen: (value: number) => {
                this.g = value;
                return this;
            },
            setBlue: (value: number) => {
                this.b = value;
                return this;
            }
        };
    }

    get rgba() {
        return {
            ...this.rgb,
            values: [...this.rgb.values, this.a],
            toString: () => `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`,
            setAlpha: this.setAlpha
        };
    }

    get hsl() {
        let h: number, s: number;

        const r = this.r / 255;
        const g = this.g / 255;
        const b = this.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        const l = (max + min) / 2;

        h = s = 0;

        if (max == min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        return {
            values: [h, s, l],
            toString: () => `hsl(${h}, ${s}, ${l})`,
            set: (hue: number, saturation: number, lightness: number) => {
                const color = Color.fromHSL(hue, saturation, lightness, this.a);

                this.r = color.r;
                this.g = color.g;
                this.b = color.b;

                return this;
            },
            setHue: (value: number) => {
                const color = Color.fromHSL(value, s, l, this.a);

                this.r = color.r;
                this.g = color.g;
                this.b = color.b;

                return this;
            },
            setSaturation: (value: number) => {
                const color = Color.fromHSL(h, value, l, this.a);

                this.r = color.r;
                this.g = color.g;
                this.b = color.b;

                return this;
            },
            setLightness: (value: number) => {
                const color = Color.fromHSL(h, s, value, this.a);

                this.r = color.r;
                this.g = color.g;
                this.b = color.b;

                return this;
            }
        };
    }

    get hsla() {
        return {
            ...this.hsl,
            values: [...this.hsl.values, this.a],
            toString: (): string =>
                `hsla(${this.hsl.values[0]}, ${this.hsl.values[1]}, ${this.hsl.values[2]}, ${this.a})`,
            setAlpha: this.setAlpha,
            set: (
                hue: number,
                saturation: number,
                lightness: number,
                alpha: number
            ): Color => {
                const color = Color.fromHSL(hue, saturation, lightness, alpha);

                this.r = color.r;
                this.g = color.g;
                this.b = color.b;
                this.a = color.a;

                return this;
            }
        };
    }

    get hex() {
        const r = this.r.toString(16);
        const g = this.g.toString(16);
        const b = this.b.toString(16);

        return {
            values: [r, g, b],
            toString: () => `#${r}${g}${b}`,
            setRed: (value: number) => {
                this.r = value;
                return this;
            },
            setGreen: (value: number) => {
                this.g = value;
                return this;
            },
            setBlue: (value: number) => {
                this.b = value;
                return this;
            }
        };
    }

    get hexa() {
        const r = this.r.toString(16);
        const g = this.g.toString(16);
        const b = this.b.toString(16);
        const a = this.a.toString(16);

        return {
            ...this.hex,
            values: [r, g, b, a],
            toString: () => `#${r}${g}${b}${a}`,
            setAlpha: this.setAlpha
        };
    }

    public setAlpha(value: number) {
        this.a = value;
        return this;
    }

    public toString(
        type: 'hex' | 'hexa' | 'hsl' | 'hsla' | 'rgb' | 'rgba' = 'rgba'
    ): string {
        switch (type) {
            case 'hex':
                return this.hex.toString();
            case 'hexa':
                return this.hexa.toString();
            case 'hsl':
                return this.hsl.toString();
            case 'hsla':
                return this.hsla.toString();
            case 'rgb':
                return this.rgb.toString();
            case 'rgba':
                return this.rgba.toString();
        }
    }

    // generating colors

    public compliment(num: number): Gradient {
        num = Math.floor(num);
        if (num < 2) num = 2;

        const interval = 1 / num;
        const hsl = this.hsl.values;
        const hues = new Array(num - 1).fill(0).map((_, i) => {
            return (hsl[0] + (i + 1) * interval) % 1;
        });

        const g = [
            this,
            ...hues.map(h => Color.fromHSL(h, hsl[1], hsl[2], this.a))
        ];

        return new Gradient(...g);
    }

    public analogous(): [Color, Color, Color] {
        const hsl = this.hsl.values;
        const hues: [number, number] = [hsl[0] - 30 / 360, hsl[0] + 30 / 360];

        const [h1, h2] = hues.map(h =>
            Color.fromHSL(h, hsl[1], hsl[2], this.a)
        );
        return [this, h1, h2];
    }

    public interpolate(toColor: Color, distance = 0.5): Color {
        if (isNaN(distance)) {
            console.warn(
                'Distance must be a number between 0 and 1. Defaulting to 0.5'
            );
            distance = 0.5;
        }

        if (!(toColor instanceof Color)) {
            console.warn(
                'toColor must be an instance of Color. Defaulting to black'
            );
            toColor = new Color(0, 0, 0);
        }

        if (distance < 0 || distance > 1) {
            console.warn(
                'Distance must be a number between 0 and 1. Defaulting to 0.5'
            );
            distance = 0.5;
        }

        const [r1, g1, b1, a1] = this.rgba.values;
        const [r2, g2, b2, a2] = toColor.rgba.values;

        const r = r1 + (r2 - r1) * distance;
        const g = g1 + (g2 - g1) * distance;
        const b = b1 + (b2 - b1) * distance;
        const a = a1 + (a2 - a1) * distance;

        return new Color(r, g, b, a);
    }

    public linearFade(color: Color, frames: number): Gradient {
        return new Gradient(
            ...new Array(frames).fill(0).map((_, i) => {
                return new Color(
                    Math.floor(this.r + ((color.r - this.r) / frames) * i),
                    Math.floor(this.g + ((color.g - this.g) / frames) * i),
                    Math.floor(this.b + ((color.b - this.b) / frames) * i),
                    this.a + ((color.a - this.a) / frames) * i
                );
            })
        );
    }

    public logarithmicFade(color: Color, frames: number, base = 2) {
        return new Gradient(
            ...new Array(frames).fill(0).map((_, i) => {
                return new Color(
                    Math.floor(
                        this.r +
                            ((color.r - this.r) / Math.pow(base, frames)) *
                                Math.pow(base, i)
                    ),
                    Math.floor(
                        this.g +
                            ((color.g - this.g) / Math.pow(base, frames)) *
                                Math.pow(base, i)
                    ),
                    Math.floor(
                        this.b +
                            ((color.b - this.b) / Math.pow(base, frames)) *
                                Math.pow(base, i)
                    ),
                    this.a +
                        ((color.a - this.a) / Math.pow(base, frames)) *
                            Math.pow(base, i)
                );
            })
        );
    }

    public exponentialFade(color: Color, frames: number, base = 2) {
        return new Gradient(
            ...new Array(frames).fill(0).map((_, i) => {
                return new Color(
                    Math.floor(
                        this.r +
                            ((color.r - this.r) / Math.pow(base, frames)) *
                                Math.pow(base, i)
                    ),
                    Math.floor(
                        this.g +
                            ((color.g - this.g) / Math.pow(base, frames)) *
                                Math.pow(base, i)
                    ),
                    Math.floor(
                        this.b +
                            ((color.b - this.b) / Math.pow(base, frames)) *
                                Math.pow(base, i)
                    ),
                    this.a +
                        ((color.a - this.a) / Math.pow(base, frames)) *
                            Math.pow(base, i)
                );
            })
        );
    }

    public detectContrast(color: Color): number {
        const l1 =
            0.2126 * Math.pow(this.r / 255, 2.2) +
            0.7152 * Math.pow(this.g / 255, 2.2) +
            0.0722 * Math.pow(this.b / 255, 2.2);
        const l2 =
            0.2126 * Math.pow(color.r / 255, 2.2) +
            0.7152 * Math.pow(color.g / 255, 2.2) +
            0.0722 * Math.pow(color.b / 255, 2.2);

        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    // view in console

    public logText(...args: any) {
        console.log(`%c${args.join(' ')}`, `color: ${this.toString()}`);
    }

    public view() {
        this.logText('Color:', this.closestName.name);
    }
}
