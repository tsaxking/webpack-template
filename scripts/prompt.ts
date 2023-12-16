export const repeatPrompt = (message: string, original?: string, validate?: (data: string) => boolean, allowBlank: boolean = false): string => {
    if (!original) original = message;
    const i = prompt(message + ':');
    if (!i && allowBlank) return '';
    if (!i) return repeatPrompt('Please enter value (' + original + ')', original, validate, allowBlank);
    if (validate && !validate(i)) return repeatPrompt('Invalid value (' + original + ')', original, validate, allowBlank);
    return i;
}