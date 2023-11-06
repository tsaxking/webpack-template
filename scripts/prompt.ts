export const repeatPrompt = (message: string, original?: string, validate?: (data: string) => boolean): string => {
    if (!original) original = message;
    const i = prompt(message + ':');
    if (!i) return repeatPrompt('Please enter value (' + original + ')', original, validate);
    if (validate && !validate(i)) return repeatPrompt('Invalid value (' + original + ')', original, validate);
    return i;
}