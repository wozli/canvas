import {chart} from './chart'
import {getChartData} from "./data";
import './styles.scss'

const newChart = chart(document.querySelector("#chart"), getChartData());
newChart.init();