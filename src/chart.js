import {toDate, isOver, line, circle, computeBoundaries, css, toCoords} from './utils'
import {tooltip} from './tooltip'
import {sliderChart} from "./slider";

const WIDTH = 600;
const HEIGHT = 200;
const PADDING = 40;
const DPI_WIDTH = WIDTH * 2;
const DPI_HEIGHT = HEIGHT * 2;
const VIEW_HEIGHT = DPI_HEIGHT - PADDING * 2;
const VIEW_WIDTH = DPI_WIDTH;
const ROWS_COUNT = 5;
const CIRCLE_RADIUS = 8;

export function chart(root, data) {
    const canvas = root.querySelector('[data-el="main"]');
    const tip = tooltip(root.querySelector('[data-el="tooltip"]'));
    const ctx = canvas.getContext('2d');
    const slider = sliderChart(root.querySelector('[data-el="slider"]'), data, DPI_WIDTH);

    let raf;

    css(canvas, {
        width : `${WIDTH}px`,
        height : `${HEIGHT}px`
    });

    canvas.width = DPI_WIDTH;
    canvas.height = DPI_HEIGHT;

    const proxy = new Proxy({}, {
        set(...args) {
            const result = Reflect.set(...args)
            raf = requestAnimationFrame(paint)
            return result
        }
    })

    function mousemove({clientX, clientY}) {
        const {left, top} = canvas.getBoundingClientRect();
        proxy.mouse = {
            x: (clientX - left) * 2,
            tooltip: {
                left: clientX - left,
                top: clientY - top
            }
        }
    }

    function mouseleave() {
        proxy.mouse = null;
        tip.hide();
    }

    canvas.addEventListener('mousemove', mousemove);
    canvas.addEventListener('mouseleave', mouseleave);

    function clear() {
        ctx.clearRect(0, 0, DPI_WIDTH, DPI_HEIGHT);
    }

    function paint() {
        clear();
        const [yMin, yMax] = computeBoundaries(data);
        const yRatio = VIEW_HEIGHT / (yMax - yMin);
        const xRatio = VIEW_WIDTH / (data.columns[0].length - 2);

        const yData = data.columns.filter((col) => data.types[col[0]] === 'line');
        const xData = data.columns.filter((col) => data.types[col[0]] !== 'line')[0];

        yAxis(yMin, yMax);
        xAxis(xData, yData, xRatio);

        yData.map(toCoords(xRatio, yRatio, DPI_HEIGHT, PADDING)).forEach((coords, index) => {
            const color = data.colors[yData[index][0]];
            line(ctx, coords, {color});

            for (const [x,y] of coords) {
                if (isOver(proxy.mouse, x, coords.length, DPI_WIDTH)) {
                    circle(ctx, [x,y], color, CIRCLE_RADIUS);
                    break;
                }
            }
        })
    }

    function yAxis(yMin, yMax) {
        // === y axis
        const step = VIEW_HEIGHT / ROWS_COUNT;
        const textStep = (yMax - yMin) / ROWS_COUNT;

        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#bbb';
        ctx.font = 'normal 20px Helvetica,sans-serif';
        ctx.fillStyle = '#96a2aa';

        for (let i = 1; i <= ROWS_COUNT; i++) {
            const y = step * i;
            const text = Math.round(yMax - textStep * i);

            ctx.fillText(text.toString(), 5, y + PADDING - 10);
            ctx.moveTo(0, y + PADDING);
            ctx.lineTo(DPI_WIDTH, y + PADDING);
            ctx.stroke();

        }
        ctx.closePath();
        // ===
    }

    function xAxis(xData, yData, xRatio) {
        const colsCount = 6;
        const step = Math.round(xData.length / colsCount);
        ctx.beginPath();
        for (let i = 1; i < xData.length; i++) {
            const x = i * xRatio;
            if ((i - 1) % step === 0) {
                const text = toDate(xData[i]);
                ctx.fillText(text.toString(), x, DPI_HEIGHT - 10);
            }

            if (isOver(proxy.mouse, x, xData.length, DPI_WIDTH)) {
                ctx.save();
                ctx.moveTo(x, PADDING / 2);
                ctx.lineTo(x, DPI_HEIGHT - PADDING);
                ctx.restore();

                tip.show(proxy.mouse.tooltip, {
                    title: toDate(xData[i]),
                    items: yData.map(col => ({
                        color: data.colors[col[0]],
                        name: data.names[col[0]],
                        value:col[i + 1],
                    }))
                })
            }
        }
        ctx.stroke();
        ctx.closePath();
    }

    return {
        init() {
            paint()
        },
        destroy() {
            cancelAnimationFrame(raf);
            canvas.removeEventListener('mousemove', mousemove);
            canvas.removeEventListener('mouseleave', mouseleave);
        }
    }
}



