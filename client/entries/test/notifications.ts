import '../../utilities/imports';
import {
    alert,
    choose,
    confirm,
    prompt,
    select
} from '../../utilities/notifications';

const createButton = (text: string, onClick: () => void) => {
    const b = document.createElement('button');
    b.id = text.toLowerCase();
    b.innerText = text;
    b.onclick = onClick;
    b.classList.add('btn', 'btn-primary');

    document.body.appendChild(b);
};

createButton('Alert', () => {
    alert('This is an alert', 'modal-alert').then(console.log);
});

createButton('Prompt', () => {
    prompt('This is a prompt', 'modal-prompt').then(console.log);
});

createButton('Confirm', () => {
    confirm('This is a confirm', 'modal-confirm').then(console.log);
});

createButton('Select', () => {
    select('This is a choose', ['a', 'b', 'c'], 'modal-select').then(console.log);
});

createButton('Choose', () => {
    choose('This is a choose', 'a', 'b', 'modal-choose').then(console.log);
});
