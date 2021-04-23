import { css } from './utils'

const template = (data) => `
    <div class="tooltip-title">${data.title}</div>
    <ul class="tooltip-list">
    ${data.items.map(item => {
        return `
            <li class="tooltip-list-item">
                <div class="value" style="color: ${item.color}">${item.value}</div>
                <div class="name" style="color: ${item.color}">${item.name}</div>
            </li>
        `
    }).join('\n')}
    </ul>
`

export function tooltip(el, wCanvas) {
    const clear = () => (el.innerHTML = '');
    const middle = wCanvas / 2;

    return {
        show({left, top}, data) {
            clear();
            const {height, width} = el.getBoundingClientRect();

            const pLeft = (left > middle ? left - width - 30 : left + 30);

            css(el,{
                display: 'block',
                top: `${top - height}px`,
                left: `${pLeft}px`
            });
            el.insertAdjacentHTML('afterbegin',template(data))
        },
        hide() {
            css(el, {display: 'none'})
        }
    }
}