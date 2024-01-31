import '../../utilities/imports';
import {
    alert,
    choose,
    confirm,
    prompt,
    select,
} from '../../utilities/notifications';

const createButton = (text: string, onClick: () => void) => {
    const b = document.createElement('button');
    b.innerText = text;
    b.onclick = onClick;
    b.classList.add('btn', 'btn-primary');

    document.body.appendChild(b);
};

createButton('Alert', () => {
    alert('This is an alert').then(console.log);
});

createButton('Prompt', () => {
    prompt('This is a prompt').then(console.log);
});

createButton('Confirm', () => {
    confirm('This is a confirm').then(console.log);
});

createButton('Select', () => {
    select('This is a choose', ['a', 'b', 'c']).then(console.log);
});

createButton('Choose', () => {
    choose('This is a choose', 'a', 'b').then(console.log);
});
