export const parseCookie = (cookie: string) => {
    var list: { [key: string]: string } = {};

    let _tempCookie: string;
    do {
        _tempCookie = decodeURI(cookie);
    }
    while(_tempCookie !== cookie);

    cookie.split(';').forEach((c) => {
        const [key, value] = c.split('='); // Split cookie into key and value
        
        list[key.trim()] = value; // Add key and value to cookie object
    });

    return list; // Returns cookie object
}